import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, idempotencyKeys } from "@/db/schema";
import { AppError, isEmail, isISODate, isPhone, isUuid, sha256, str } from "./http";
import { bookingTokenHash, createBookingToken } from "./auth";
import { getBookingDetail } from "./repositories";
import { recordAdminNotification } from "./notifications";

export interface CreateBookingInput {
  serviceId: string;
  packageId?: string | null;
  album?: boolean;
  extras?: string[];
  dates: string[];
  client: {
    name: string;
    email: string;
    phone: string;
    state?: string;
    district: string;
    city: string;
  };
  budget?: string;
  notes?: string;
  idempotencyKey?: string;
}

function validate(input: CreateBookingInput) {
  if (!isUuid(input.serviceId)) throw new AppError("INVALID_INPUT", "Please choose a service.");
  if (input.packageId && !isUuid(input.packageId)) {
    throw new AppError("INVALID_INPUT", "Please choose a valid package.");
  }
  if (!Array.isArray(input.dates) || input.dates.length === 0) {
    throw new AppError("INVALID_INPUT", "Please select at least one date.");
  }
  if (input.dates.length > 5) {
    throw new AppError("INVALID_INPUT", "A single request can hold a maximum of 5 days.");
  }
  if (!input.dates.every(isISODate)) {
    throw new AppError("INVALID_INPUT", "One of the selected dates is not valid.");
  }
  const sorted = [...input.dates].sort();
  if (sorted[0] > sorted[sorted.length - 1]) {
    throw new AppError("INVALID_INPUT", "The date range is not valid.");
  }
  if ((input.extras ?? []).some((e) => !isUuid(e))) {
    throw new AppError("INVALID_INPUT", "One of the selected extras is not valid.");
  }
  str(input.client?.name, "Name", 120, 2);
  if (!isEmail(input.client?.email)) throw new AppError("INVALID_INPUT", "Enter a valid email address.");
  if (!isPhone(input.client?.phone)) throw new AppError("INVALID_INPUT", "Enter a valid phone number.");
  str(input.client?.district ?? "", "District", 80);
str(input.client?.state ?? "", "State", 80);
  str(input.client?.city ?? "", "City", 160, 2);
  str(input.budget ?? "", "Budget", 80);
  str(input.notes ?? "", "Notes", 4000);
}

export interface CreatedBooking {
  bookingNumber: string;
  status: string;
  serviceName: string;
  packageName: string | null;
  packageOption: string | null;
  dates: string[];
  extras: { id: string; name: string; price: number }[];
  baseAmount: number;
  extrasAmount: number;
  estimate: number;
  currency: string;
  accessToken: string;
  statusUrl: string;
  expiresAt: string | null;
}

/**
 * Creates a booking through the atomic Postgres function.
 * Pricing, availability and booking numbers all come from the database.
 */
export async function createBooking(input: CreateBookingInput): Promise<CreatedBooking> {
  validate(input);

  const payloadForHash = JSON.stringify({
    serviceId: input.serviceId,
    packageId: input.packageId ?? null,
    album: input.album ?? true,
    extras: [...(input.extras ?? [])].sort(),
    dates: [...input.dates].sort(),
    email: input.client.email.toLowerCase(),
  });
  const requestHash = sha256(payloadForHash);
  const key = input.idempotencyKey?.slice(0, 120);

  if (key) {
    const existing = await db
      .select()
      .from(idempotencyKeys)
      .where(eq(idempotencyKeys.key, key))
      .limit(1);
    const row = existing[0];
    if (row) {
      if (row.requestHash !== requestHash) throw new AppError("IDEMPOTENCY_CONFLICT");
      if (row.status === "COMPLETED" && row.resultPayload) {
        return row.resultPayload as unknown as CreatedBooking;
      }
      throw new AppError("BOOKING_CONFLICT", "This request is still being processed.");
    }
    await db
      .insert(idempotencyKeys)
      .values({ key, requestHash, scope: "create-booking", status: "IN_PROGRESS" });
  }

  const token = createBookingToken();

  try {
    const res = await db.execute<{ create_booking_atomic: Record<string, unknown> }>(sql`
      select create_booking_atomic(${JSON.stringify({
        serviceId: input.serviceId,
        packageId: input.packageId ?? null,
        album: input.album ?? true,
        extras: input.extras ?? [],
        dates: [...input.dates].sort(),
        client: input.client,
        budget: input.budget ?? "",
        notes: input.notes ?? "",
        accessTokenHash: token.hash,
      })}::jsonb)
    `);

    const raw = res.rows[0].create_booking_atomic as {
      bookingNumber: string;
      status: string;
      serviceName: string;
      packageName: string | null;
      packageOption: string | null;
      dates: string[];
      extras: { id: string; name: string; price: string | number }[];
      baseAmount: string | number;
      extrasAmount: string | number;
      estimate: string | number;
      currency: string;
      expiresAt: string | null;
    };

    const result: CreatedBooking = {
      bookingNumber: raw.bookingNumber,
      status: raw.status,
      serviceName: raw.serviceName,
      packageName: raw.packageName ?? null,
      packageOption: raw.packageOption ?? null,
      dates: raw.dates ?? [],
      extras: (raw.extras ?? []).map((e) => ({
        id: String(e.id),
        name: e.name,
        price: Number(e.price),
      })),
      baseAmount: Number(raw.baseAmount),
      extrasAmount: Number(raw.extrasAmount),
      estimate: Number(raw.estimate),
      currency: raw.currency ?? "INR",
      accessToken: token.token,
      statusUrl: `/booking/${raw.bookingNumber}?token=${token.token}`,
      expiresAt: raw.expiresAt ?? null,
    };

    if (key) {
      await db
        .update(idempotencyKeys)
        .set({
          status: "COMPLETED",
          resultRef: result.bookingNumber,
          resultPayload: result as unknown as Record<string, unknown>,
        })
        .where(eq(idempotencyKeys.key, key));
    }

    const firstDateStr = result.dates[0]
      ? new Date(result.dates[0]).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "";
    await recordAdminNotification({
      eventType: "BOOKING_CREATED",
      title: input.client.name,
      message: `${result.bookingNumber}${firstDateStr ? ` · ${firstDateStr}` : ""}`,
      category: "BOOKING",
      entityType: "booking",
      entityId: result.bookingNumber,
      link: "/admin/bookings",
      roleScope: "TEAM",
      dedupeKey: `booking:created:${result.bookingNumber}`,
      metadata: {
        bookingNumber: result.bookingNumber,
        clientName: input.client.name,
        serviceName: result.serviceName,
        status: result.status,
        estimate: result.estimate,
      },
    });

    return result;
  } catch (err) {
    if (key) await db.delete(idempotencyKeys).where(eq(idempotencyKeys.key, key));
    throw err;
  }
}

/** Server-authoritative quote used by the booking estimate step. */
export async function quoteBooking(input: {
  serviceId: string;
  packageId?: string | null;
  album?: boolean;
  extras?: string[];
  dates?: string[];
}) {
  if (!isUuid(input.serviceId)) throw new AppError("INVALID_INPUT", "Please choose a service.");
  const res = await db.execute<{ calculate_booking_quote: Record<string, unknown> }>(sql`
    select calculate_booking_quote(${JSON.stringify({
      serviceId: input.serviceId,
      packageId: input.packageId ?? null,
      album: input.album ?? true,
      extras: input.extras ?? [],
      dates: input.dates ?? [],
    })}::jsonb)
  `);
  const q = res.rows[0].calculate_booking_quote as Record<string, string | number | null>;
  return {
    serviceName: q.serviceName as string,
    packageName: (q.packageName as string) ?? null,
    packageOptionLabel: (q.packageOptionLabel as string) ?? null,
    days: Number(q.days ?? 1),
    baseAmount: Number(q.baseAmount ?? 0),
    extrasAmount: Number(q.extrasAmount ?? 0),
    total: Number(q.total ?? 0),
    currency: (q.currency as string) ?? "INR",
    extras: (q.extras as unknown as { id: string; name: string; price: string }[]).map((e) => ({
      id: e.id,
      name: e.name,
      price: Number(e.price),
    })),
  };
}

/** Resolve a booking number from a private access token (token-only input). */
export async function resolveBookingByToken(token: string): Promise<string> {
  if (!token) throw new AppError("ACCESS_DENIED");
  const hash = bookingTokenHash(token);
  const rows = await db.select({ bookingNumber: bookings.bookingNumber }).from(bookings).where(eq(bookings.accessTokenHash, hash)).limit(1);
  if (!rows[0]) throw new AppError("BOOKING_NOT_FOUND");
  return rows[0].bookingNumber;
}
export async function getClientBookingView(bookingNumber: string, token: string) {
  if (!token) throw new AppError("ACCESS_DENIED");
  const rows = await db
    .select({ id: bookings.id, hash: bookings.accessTokenHash })
    .from(bookings)
    .where(eq(bookings.bookingNumber, bookingNumber))
    .limit(1);
  const row = rows[0];
  if (!row) throw new AppError("BOOKING_NOT_FOUND");
  if (row.hash !== bookingTokenHash(token)) throw new AppError("ACCESS_DENIED");

  const detail = await getBookingDetail(bookingNumber);
  if (!detail) throw new AppError("BOOKING_NOT_FOUND");

  return {
    bookingNumber: detail.bookingNumber,
    status: detail.status,
    clientName: detail.clientName,
    clientEmail: detail.clientEmail,
    clientPhone: detail.clientPhone,
    district: detail.district,
    city: detail.city,
    serviceName: detail.serviceName,
    packageName: detail.packageName,
    album: detail.album,
    dates: detail.dates,
    extras: detail.extras,
    baseAmount: detail.baseAmount,
    extrasAmount: detail.extrasAmount,
    estimate: detail.estimate,
    notes: detail.notes,
    budget: detail.budget,
    createdAt: detail.createdAt,
    expiresAt: detail.expiresAt,
    timeline: detail.timeline,
  };
}

export type ClientBookingView = Awaited<ReturnType<typeof getClientBookingView>>;
