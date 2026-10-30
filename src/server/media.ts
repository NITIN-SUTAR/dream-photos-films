import { mkdir, writeFile, readFile, unlink, stat } from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets, mediaVariants } from "@/db/schema";
import { AppError } from "./http";

export type Bucket = "public-media" | "private-gallery" | "private-documents";

const ROOT = process.env.MEDIA_ROOT ?? path.join(process.cwd(), ".data", "media");

const IMAGE_TYPES: Record<string, { ext: string; magic: number[][] }> = {
  "image/jpeg": { ext: "jpg", magic: [[0xff, 0xd8, 0xff]] },
  "image/png": { ext: "png", magic: [[0x89, 0x50, 0x4e, 0x47]] },
  "image/webp": { ext: "webp", magic: [[0x52, 0x49, 0x46, 0x46]] },
};

const VIDEO_TYPES: Record<string, { ext: string; magic: number[][] }> = {
  "video/mp4": {
    ext: "mp4",
    // ....ftyp
    magic: [[0x66, 0x74, 0x79, 0x70]],
  },
  "video/webm": { ext: "webm", magic: [[0x1a, 0x45, 0xdf, 0xa3]] },
};

const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

export function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function matchesMagic(buf: Buffer, magics: number[][], offsetSearch = 0): boolean {
  return magics.some((magic) => {
    if (offsetSearch > 0) {
      const head = buf.subarray(0, 32);
      return head.includes(Buffer.from(magic));
    }
    return magic.every((byte, i) => buf[i] === byte);
  });
}

/** Reads intrinsic dimensions from PNG/JPEG headers (no image library required). */
export function readImageSize(buf: Buffer): { width: number; height: number } | null {
  if (buf[0] === 0x89 && buf[1] === 0x50) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  return null;
}

export interface StoredMedia {
  assetId: string;
  bucket: Bucket;
  storagePath: string;
  width: number | null;
  height: number | null;
  mimeType: string;
  fileSize: number;
  status: "READY" | "FAILED" | "PROCESSING";
}

/**
 * Validates and stores a file, then records the asset.
 * Media is only marked READY after the bytes are written and verified on disk.
 */
export async function storeUpload(opts: {
  file: File;
  bucket: Bucket;
  prefix: string;
  kind: "IMAGE" | "VIDEO";
}): Promise<StoredMedia> {
  const { file, bucket, prefix, kind } = opts;
  const declared = file.type;
  const table = kind === "IMAGE" ? IMAGE_TYPES : VIDEO_TYPES;
  const spec = table[declared];
  if (!spec) throw new AppError("INVALID_INPUT", `Unsupported file type: ${declared || "unknown"}.`);

  const maxBytes = kind === "IMAGE" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (file.size <= 0 || file.size > maxBytes) {
    throw new AppError("INVALID_INPUT", `File must be between 1 byte and ${maxBytes / 1048576}MB.`);
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (!matchesMagic(buf, spec.magic, kind === "VIDEO" ? 1 : 0)) {
    throw new AppError("INVALID_INPUT", "File contents do not match the declared type.");
  }

  const size = readImageSize(buf);
  if (kind === "IMAGE" && !size) {
    throw new AppError("MEDIA_PROCESSING_FAILED", "Could not read image dimensions.");
  }

  const id = randomUUID();
  const storagePath = `${prefix}/${id}/${sanitizeName(file.name) || `file.${spec.ext}`}`;
  const absolute = path.join(ROOT, bucket, storagePath);

  const [asset] = await db
    .insert(mediaAssets)
    .values({
      id,
      bucket,
      storagePath,
      mediaType: kind,
      mimeType: declared,
      fileSize: buf.byteLength,
      width: size?.width ?? null,
      height: size?.height ?? null,
      status: "PROCESSING",
      originalName: file.name.slice(0, 200),
      checksum: createHash("sha256").update(buf).digest("hex"),
    })
    .returning();

  try {
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, buf);
    const written = await stat(absolute);
    if (written.size !== buf.byteLength) throw new Error("size mismatch after write");

    // Record the delivered representation. Responsive variants are served by
    // width hints on the same object; additional derivatives can be registered here.
    await db
      .insert(mediaVariants)
      .values({
        assetId: asset.id,
        variant: "original",
        storagePath,
        width: size?.width ?? null,
        height: size?.height ?? null,
        fileSize: buf.byteLength,
      })
      .onConflictDoNothing();

    await db.update(mediaAssets).set({ status: "READY", updatedAt: new Date() }).where(eq(mediaAssets.id, asset.id));
  } catch (err) {
    await db
      .update(mediaAssets)
      .set({
        status: "FAILED",
        failureReason: (err as Error).message.slice(0, 300),
        updatedAt: new Date(),
      })
      .where(eq(mediaAssets.id, asset.id));
    throw new AppError("MEDIA_PROCESSING_FAILED", "The file could not be stored. Nothing was published.");
  }

  return {
    assetId: asset.id,
    bucket,
    storagePath,
    width: size?.width ?? null,
    height: size?.height ?? null,
    mimeType: declared,
    fileSize: buf.byteLength,
    status: "READY",
  };
}

export async function readMedia(bucket: Bucket, storagePath: string): Promise<Buffer> {
  const safe = path.normalize(storagePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const absolute = path.join(ROOT, bucket, safe);
  if (!absolute.startsWith(path.join(ROOT, bucket))) throw new AppError("ACCESS_DENIED");
  try {
    return await readFile(absolute);
  } catch {
    throw new AppError("NOT_FOUND");
  }
}

/** Deletes storage objects only after the database no longer references them. */
export async function deleteMediaAsset(assetId: string) {
  const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, assetId)).limit(1);
  if (!asset) return;
  const variants = await db.select().from(mediaVariants).where(eq(mediaVariants.assetId, assetId));
  await db.delete(mediaAssets).where(eq(mediaAssets.id, assetId));
  for (const p of [asset.storagePath, ...variants.map((v) => v.storagePath)]) {
    try {
      await unlink(path.join(ROOT, asset.bucket, p));
    } catch {
      /* object already gone — nothing to clean up */
    }
  }
}

export function publicMediaUrl(bucket: Bucket, storagePath: string): string {
  return `/api/media/${bucket}/${storagePath}`;
}
