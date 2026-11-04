import { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { AppError, fail, ok, requestId } from "@/server/http";
import { requireUser } from "@/server/auth";
import { getMediaStorageBudgetBytes } from "@/server/storage";

export async function GET(req: NextRequest) {
  const rid = requestId();
  try {
    await requireUser();
    const budgetBytes = getMediaStorageBudgetBytes();
    const result = await db.execute<{ used_bytes: string | null }>(sql`
      select coalesce(sum(file_size)::text, '0') as used_bytes
      from media_assets
      where status = 'READY'
    `);
    const usedBytes = Number(result.rows[0]?.used_bytes ?? "0");
    const remainingBytes = budgetBytes ? Math.max(0, budgetBytes - usedBytes) : null;
    const percentUsed = budgetBytes ? (usedBytes / budgetBytes) * 100 : null;
    return ok({
      usedBytes,
      budgetBytes,
      remainingBytes,
      percentUsed,
      warningThreshold: 75,
      blockThreshold: 85,
      budgetConfigured: budgetBytes !== null,
      note: budgetBytes
        ? "This is an application-managed estimate based on the database record set, not a total Supabase project quota."
        : "MEDIA_STORAGE_BUDGET_BYTES is not configured. Storage usage cannot be calculated accurately without an explicit budget.",
    });
  } catch (error) {
    return fail(error, rid);
  }
}
