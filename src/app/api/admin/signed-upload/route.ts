import { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { AppError, fail, ok, readJson, requestId } from "@/server/http";
import { requireUser } from "@/server/auth";
import { getMediaStorageBudgetBytes, getSupabaseAdmin, isBucketAllowed, parseUploadBucket } from "@/server/storage";

export async function POST(req: NextRequest) {
  const rid = requestId();
  try {
    const user = await requireUser();
    const body = await readJson<{
      bucket?: string;
      path?: string;
      scope?: string;
      kind?: "IMAGE" | "VIDEO";
      expectedSize?: number;
      mimeType?: string;
    }>(req);
    const scope = String(body.scope ?? "portfolio");
    const bucket = body.bucket ? String(body.bucket) : parseUploadBucket(scope);
    const path = String(body.path ?? "");
    const mediaType = (body.kind ?? "IMAGE").toUpperCase() === "VIDEO" ? "VIDEO" : "IMAGE";
    const expectedSize = Number(body.expectedSize ?? 0);

    if (!isBucketAllowed(bucket)) {
      throw new AppError("INVALID_INPUT", "This storage bucket is not allowed.");
    }
    if (!path || path.includes("..") || path.startsWith("/") || !path.includes(".")) {
      throw new AppError("INVALID_INPUT", "A safe destination path is required.");
    }
    if (!Number.isFinite(expectedSize) || expectedSize <= 0) {
      throw new AppError("INVALID_INPUT", "The upload size must be greater than zero.");
    }

    const maxAllowedSize = mediaType === "VIDEO" ? 250 * 1024 * 1024 : 80 * 1024 * 1024;
    if (expectedSize > maxAllowedSize) {
      throw new AppError("INVALID_INPUT", `This ${mediaType.toLowerCase()} is too large for browser upload.`);
    }

    const budgetBytes = getMediaStorageBudgetBytes();
    const usageRes = await db.execute<{ used_bytes: string | null }>(sql`
      select coalesce(sum(file_size)::text, '0') as used_bytes
      from media_assets
      where status = 'READY'
    `);
    const usedBytes = Number(usageRes.rows[0]?.used_bytes ?? "0");
    const remainingBytes = budgetBytes ? Math.max(0, budgetBytes - usedBytes) : null;
    const percentUsed = budgetBytes ? (usedBytes / budgetBytes) * 100 : null;

    if (
      budgetBytes &&
      ((remainingBytes !== null && expectedSize > remainingBytes) ||
        (percentUsed !== null && percentUsed >= 85))
    ) {
      throw new AppError(
        "INVALID_INPUT",
        "The project storage budget is full. Delete unused media before uploading more.",
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path, { upsert: false });
    if (error) throw error;
    return ok({
      signedUrl: data?.signedUrl ?? "",
      bucket,
      path,
      mediaType,
      expectedSize,
      userRole: user.role,
      usage: {
        usedBytes,
        budgetBytes,
        remainingBytes,
        percentUsed,
        warningThreshold: 75,
        blockThreshold: 85,
      },
    });
  } catch (e) {
    return fail(e, rid);
  }
}