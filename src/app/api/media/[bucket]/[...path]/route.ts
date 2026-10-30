import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { AppError, fail, requestId } from "@/server/http";
import { currentUser, verifyMediaSignature } from "@/server/auth";
import { readMedia, type Bucket } from "@/server/media";

export const dynamic = "force-dynamic";

const BUCKETS: Bucket[] = ["public-media", "private-gallery", "private-documents"];

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ bucket: string; path: string[] }> },
) {
  const rid = requestId();
  try {
    const { bucket, path } = await ctx.params;
    if (!BUCKETS.includes(bucket as Bucket)) throw new AppError("NOT_FOUND");
    const storagePath = path.join("/");

    if (bucket !== "public-media") {
      const exp = req.nextUrl.searchParams.get("exp") ?? "";
      const sig = req.nextUrl.searchParams.get("sig") ?? "";
      const signed = verifyMediaSignature(`${bucket}/${storagePath}`, exp, sig);
      if (!signed) {
        // admins may read private objects directly from the CMS
        const user = await currentUser();
        if (!user) throw new AppError("ACCESS_DENIED");
      }
    }

    const [asset] = await db
      .select()
      .from(mediaAssets)
      .where(and(eq(mediaAssets.bucket, bucket), eq(mediaAssets.storagePath, storagePath)))
      .limit(1);
    if (!asset || asset.status !== "READY") throw new AppError("NOT_FOUND");

    const body = await readMedia(bucket as Bucket, storagePath);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "content-type": asset.mimeType,
        "content-length": String(body.byteLength),
        "cache-control":
          bucket === "public-media"
            ? "public, max-age=31536000, immutable"
            : "private, max-age=0, no-store",
      },
    });
  } catch (err) {
    return fail(err, rid);
  }
}
