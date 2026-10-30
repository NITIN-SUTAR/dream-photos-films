import { NextResponse } from "next/server";
import { randomUUID, createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INVALID_INPUT"
  | "DATE_UNAVAILABLE"
  | "BOOKING_CONFLICT"
  | "INVALID_STATUS_TRANSITION"
  | "BOOKING_NOT_FOUND"
  | "NOT_FOUND"
  | "ACCESS_DENIED"
  | "MEDIA_PROCESSING_FAILED"
  | "RATE_LIMITED"
  | "IDEMPOTENCY_CONFLICT"
  | "INTERNAL_ERROR";

const STATUS: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  INVALID_INPUT: 400,
  DATE_UNAVAILABLE: 409,
  BOOKING_CONFLICT: 409,
  INVALID_STATUS_TRANSITION: 422,
  BOOKING_NOT_FOUND: 404,
  NOT_FOUND: 404,
  ACCESS_DENIED: 403,
  MEDIA_PROCESSING_FAILED: 422,
  RATE_LIMITED: 429,
  IDEMPOTENCY_CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  code: ErrorCode;
  detail?: string;
  constructor(code: ErrorCode, message?: string, detail?: string) {
    super(message ?? code);
    this.code = code;
    this.detail = detail;
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

/** Maps thrown errors (including Postgres business errors) to safe responses. */
export function fail(error: unknown, requestId: string = randomUUID()) {
  let code: ErrorCode = "INTERNAL_ERROR";
  let message = "Something went wrong on our side. Please try again.";

  // drizzle/pg wrap driver errors — unwrap to find the real cause
  let raw_error: unknown = error;
  for (let i = 0; i < 4; i++) {
    const cause = (raw_error as { cause?: unknown })?.cause;
    if (cause && typeof cause === "object") raw_error = cause;
    else break;
  }

  if (error instanceof AppError) {
    code = error.code;
    message = error.message === error.code ? defaultMessage(error.code) : error.message;
  } else if (typeof raw_error === "object" && raw_error !== null) {
    const pg = raw_error as { code?: string; message?: string; constraint?: string };
    const raw = pg.message ?? "";
    const known = (
      [
        "DATE_UNAVAILABLE",
        "BOOKING_CONFLICT",
        "INVALID_STATUS_TRANSITION",
        "BOOKING_NOT_FOUND",
        "INVALID_INPUT",
        "ACCESS_DENIED",
        "FORBIDDEN",
      ] as ErrorCode[]
    ).find((c) => raw.includes(c));
    if (known) {
      code = known;
      message = defaultMessage(known);
    } else if (pg.code === "23505") {
      // unique violation — most often the active booking-date safety net
      code = pg.constraint === "booking_dates_active_unique" ? "DATE_UNAVAILABLE" : "BOOKING_CONFLICT";
      message = defaultMessage(code);
    } else if (pg.code === "23514" || pg.code === "22P02") {
      code = "INVALID_INPUT";
      message = defaultMessage(code);
    }
  }

  if (code === "INTERNAL_ERROR") {
    console.error(`[${requestId}] unhandled`, error);
  }
  return NextResponse.json(
    { ok: false, error: { code, message, requestId } },
    { status: STATUS[code] },
  );
}

export function defaultMessage(code: ErrorCode): string {
  switch (code) {
    case "UNAUTHORIZED":
      return "Please sign in to continue.";
    case "FORBIDDEN":
    case "ACCESS_DENIED":
      return "You do not have permission to do that.";
    case "INVALID_INPUT":
      return "Some of the details sent were not valid. Please review and try again.";
    case "DATE_UNAVAILABLE":
      return "One or more of those dates has just been taken. Please choose another date.";
    case "BOOKING_CONFLICT":
      return "That date is already committed to another booking.";
    case "INVALID_STATUS_TRANSITION":
      return "That status change is not allowed for this booking.";
    case "BOOKING_NOT_FOUND":
      return "We could not find a booking with those details.";
    case "NOT_FOUND":
      return "That record no longer exists.";
    case "MEDIA_PROCESSING_FAILED":
      return "We could not process that file. Please check the format and try again.";
    case "RATE_LIMITED":
      return "Too many attempts. Please wait a moment and try again.";
    case "IDEMPOTENCY_CONFLICT":
      return "This request was already submitted with different details.";
    default:
      return "Something went wrong on our side. Please try again.";
  }
}

export function requestId(): string {
  return randomUUID();
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local"
  );
}

/** Database-backed fixed-window rate limiter. */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  const res = await db.execute<{ count: number }>(sql`
    insert into rate_limits (bucket_key, window_start, count)
    values (${key}, now(), 1)
    on conflict (bucket_key) do update
      set count = case
            when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) then 1
            else rate_limits.count + 1 end,
          window_start = case
            when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) then now()
            else rate_limits.window_start end
    returning count
  `);
  const count = Number(res.rows[0]?.count ?? 0);
  if (count > limit) throw new AppError("RATE_LIMITED");
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new AppError("INVALID_INPUT", "Request body must be valid JSON.");
  }
}

/* ----------------------------- validation ---------------------------- */

export const isEmail = (v: unknown): v is string =>
  typeof v === "string" && v.length <= 160 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const isPhone = (v: unknown): v is string =>
  typeof v === "string" && v.length <= 24 && /^[+\d][\d\s-]{7,}$/.test(v);

export const isISODate = (v: unknown): v is string =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

export const isUuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export function str(value: unknown, field: string, max = 400, min = 0): string {
  if (typeof value !== "string") throw new AppError("INVALID_INPUT", `${field} is required.`);
  const trimmed = value.trim();
  if (trimmed.length < min) throw new AppError("INVALID_INPUT", `${field} is too short.`);
  if (trimmed.length > max) throw new AppError("INVALID_INPUT", `${field} is too long.`);
  return trimmed;
}

export function num(value: unknown, field: string, min = 0, max = 100_000_000): number {
  const n = typeof value === "string" ? Number(value) : (value as number);
  if (typeof n !== "number" || Number.isNaN(n)) {
    throw new AppError("INVALID_INPUT", `${field} must be a number.`);
  }
  if (n < min || n > max) throw new AppError("INVALID_INPUT", `${field} is out of range.`);
  return n;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
