import { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { AppError, fail, ok, requestId } from "@/server/http";
import { currentUser } from "@/server/auth";
import { processNotifications } from "@/server/notify";
import { seedDatabase } from "@/server/seed";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function authorise(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const providedCron = req.headers.get("x-cron-secret");
  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (secret && (providedCron === secret || bearer === secret)) return "CRON";
  const user = await currentUser();
  if (user?.role === "OWNER") return "OWNER";
  throw new AppError("UNAUTHORIZED");
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ job: string }> }) {
  const rid = requestId();
  try {
    const { job } = await ctx.params;

    if (job === "seed") {
      // bootstrap is allowed while the catalogue is empty, otherwise privileged
      const existing = await db.execute<{ c: string }>(sql`select count(*)::text as c from services`);
      if (Number(existing.rows[0].c) > 0) await authorise(req);
      const result = await seedDatabase();
      console.info(`[${rid}] seed`, result);
      return ok(result);
    }

    await authorise(req);

    if (job === "expire-bookings") {
      const res = await db.execute<{ expire_pending_bookings: number }>(
        sql`select expire_pending_bookings()`,
      );
      const expired = Number(res.rows[0].expire_pending_bookings);
      console.info(`[${rid}] expired ${expired} pending bookings`);
      return ok({ expired });
    }

    if (job === "process-notifications") {
      const result = await processNotifications(25);
      console.info(`[${rid}] notifications`, result);
      return ok(result);
    }

    throw new AppError("NOT_FOUND");
  } catch (err) {
    return fail(err, rid);
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ job: string }> }) {
  return POST(req, ctx);
}
