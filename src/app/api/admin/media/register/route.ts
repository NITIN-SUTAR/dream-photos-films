import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { AppError, fail, ok, readJson, requestId, str } from "@/server/http";
import { requireUser } from "@/server/auth";
import { getSupabaseAdmin, isBucketAllowed, type MediaBucket } from "@/server/storage";
import { cleanupFailedStorageRegistration, publicMediaUrl } from "@/server/media";

export async function POST(req: NextRequest) {
  const rid = requestId();
  try {
    const user = await requireUser();
    const body = await readJson<{
      bucket?: string;
      storagePath?: string;
      mediaType?: "IMAGE" | "VIDEO";
      mimeType?: string;
      fileSize?: number;
      width?: number | null;
      height?: number | null;
      durationSeconds?: number | null;
      originalName?: string;
      checksum?: string;
    }>(req);

    const bucket = String(body.bucket ?? "");
    const storagePath = String(body.storagePath ?? "");
    const mediaType = (body.mediaType ?? "IMAGE").toUpperCase() === "VIDEO" ? "VIDEO" : "IMAGE";
    const mimeType = String(body.mimeType ?? "application/octet-stream");

    if (!bucket || !isBucketAllowed(bucket)) {
      throw new AppError("INVALID_INPUT", "The bucket for this upload is not allowed.");
    }
    if (!storagePath || storagePath.includes("..") || storagePath.startsWith("/")) {
      throw new AppError("INVALID_INPUT", "The storage path is not valid.");
    }
    const fileSize = Number(body.fileSize ?? 0);
    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      throw new AppError("INVALID_INPUT", "The size of the uploaded file must be valid.");
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage.from(bucket as MediaBucket).download(storagePath);
    if (error || !data) {
      throw new AppError("MEDIA_PROCESSING_FAILED", "The uploaded object could not be verified in storage.");
    }

    const originalName = str(body.originalName ?? "upload", "Original file name", 200, 1).slice(0, 200);
    const assetId = crypto.randomUUID();
    const payload = {
      id: assetId,
      bucket,
      storagePath,
      mediaType,
      mimeType,
      fileSize,
      width: Number.isFinite(Number(body.width)) ? Number(body.width) : null,
      height: Number.isFinite(Number(body.height)) ? Number(body.height) : null,
      durationSeconds:
        Number.isFinite(Number(body.durationSeconds)) && Number(body.durationSeconds) >= 0
          ? String(Number(body.durationSeconds))
          : null,
      status: "READY",
      originalName,
      checksum: body.checksum?.slice(0, 128) ?? null,
      failureReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await db
        .insert(mediaAssets)
        .values(payload)
        .onConflictDoUpdate({
          target: [mediaAssets.bucket, mediaAssets.storagePath],
          set: { ...payload, updatedAt: new Date() },
        });
    } catch (error) {
      try {
        await cleanupFailedStorageRegistration(supabase, bucket as MediaBucket, storagePath);
      } catch {
        // Storage cleanup is best-effort after a database failure.
      }
      throw error;
    }

    await db
      .update(mediaAssets)
      .set({ status: "READY", updatedAt: new Date() })
      .where(and(eq(mediaAssets.bucket, bucket), eq(mediaAssets.storagePath, storagePath)));

    return ok(
      {
        assetId,
        bucket,
        storagePath,
        url: publicMediaUrl(bucket as MediaBucket, storagePath),
        width: payload.width,
        height: payload.height,
        status: "READY",
      },
      201,
    );
  } catch (error) {
    return fail(error, rid);
  }
}
