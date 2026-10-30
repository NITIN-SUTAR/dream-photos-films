import { NextRequest } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, galleryAlbums, galleryPhotos, pushSubscriptions } from "@/db/schema";
import {
  AppError,
  clientIp,
  fail,
  isISODate,
  ok,
  rateLimit,
  readJson,
  requestId,
} from "@/server/http";
import { bookingTokenHash, signMediaPath } from "@/server/auth";
import { getAvailability, listExtras, listPackages, listServices } from "@/server/repositories";
import { createBooking, getClientBookingView, quoteBooking, resolveBookingByToken } from "@/server/booking";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const rid = requestId();
  try {
    const { path } = await ctx.params;
    const [head, second] = path;
    const url = req.nextUrl.searchParams;

    if (head === "catalog") {
      const [services, packages, extras] = await Promise.all([
        listServices(),
        listPackages(),
        listExtras(),
      ]);
      return ok({ services, packages, extras });
    }

    if (head === "availability") {
      const from = url.get("from");
      const to = url.get("to");
      if (!isISODate(from) || !isISODate(to)) {
        throw new AppError("INVALID_INPUT", "A valid from/to date range is required.");
      }
      await rateLimit(`avail:${clientIp(req)}`, 600, 60);
      return ok({ days: await getAvailability(from, to) });
    }

if (head === "bookings" && second === "resolve") {
      await rateLimit(`bresolve:${clientIp(req)}`, 30, 60);
      const token = url.get("token") ?? "";
      const bookingNumber = await resolveBookingByToken(token);
      return ok({ bookingNumber });
    }

    if (head === "bookings" && second) {
      await rateLimit(`bstatus:${clientIp(req)}`, 60, 60);
      const token = url.get("token") ?? "";
      return ok(await getClientBookingView(second, token));
    }

    if (head === "gallery" && second) {
      const token = url.get("token") ?? "";
      const [album] = await db
        .select()
        .from(galleryAlbums)
        .where(eq(galleryAlbums.slug, second))
        .limit(1);
      if (!album) throw new AppError("NOT_FOUND");

      // A gallery attached to a booking requires that booking's access token.
      if (album.bookingId) {
        const [booking] = await db
          .select({ hash: bookings.accessTokenHash })
          .from(bookings)
          .where(eq(bookings.id, album.bookingId))
          .limit(1);
        if (!booking || !token || booking.hash !== bookingTokenHash(token)) {
          throw new AppError("ACCESS_DENIED");
        }
      } else if (!album.active) {
        throw new AppError("ACCESS_DENIED");
      }

      const photos = await db
        .select()
        .from(galleryPhotos)
        .where(and(eq(galleryPhotos.albumId, album.id), eq(galleryPhotos.active, true)))
        .orderBy(galleryPhotos.displayOrder);

      return ok({
        album: {
          slug: album.slug,
          title: album.title,
          client: album.clientName,
          event: album.event,
          date: album.eventDate ? String(album.eventDate) : "",
          location: album.location,
        },
        photos: photos.map((p) => ({
          id: p.id,
          src: p.externalUrl
            ? p.externalUrl
            : `/api/media/private-gallery/${p.storagePath}?${signMediaPath(
                `private-gallery/${p.storagePath}`,
                600,
              )}`,
          alt: p.alt,
          width: p.width,
          height: p.height,
        })),
      });
    }

    throw new AppError("NOT_FOUND");
  } catch (err) {
    return fail(err, rid);
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const rid = requestId();
  try {
    const { path } = await ctx.params;
    const [head, second] = path;

    if (head === "quote") {
      await rateLimit(`quote:${clientIp(req)}`, 300, 60);
      const body = await readJson<Parameters<typeof quoteBooking>[0]>(req);
      return ok(await quoteBooking(body));
    }

    if (head === "bookings") {
      await rateLimit(`book:${clientIp(req)}`, 10, 600);
      const body = await readJson<Parameters<typeof createBooking>[0]>(req);
      const idempotencyKey = req.headers.get("idempotency-key") ?? body.idempotencyKey;
      const created = await createBooking({
        ...body,
        idempotencyKey: idempotencyKey ?? undefined,
      });
      console.info(`[${rid}] booking created ${created.bookingNumber}`);
      return ok(created, 201);
    }

    if (head === "push" && second === "subscribe") {
      await rateLimit(`push:${clientIp(req)}`, 20, 600);
      const body = await readJson<{
        endpoint: string;
        keys: { p256dh: string; auth: string };
        bookingNumber?: string;
        token?: string;
      }>(req);
      if (!body?.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
        throw new AppError("INVALID_INPUT", "A complete push subscription is required.");
      }

      let bookingId: string | null = null;
      if (body.bookingNumber) {
        const [row] = await db
          .select({ id: bookings.id, hash: bookings.accessTokenHash })
          .from(bookings)
          .where(eq(bookings.bookingNumber, body.bookingNumber))
          .limit(1);
        // never attach a subscription to a booking the caller cannot prove access to
        if (!row || !body.token || row.hash !== bookingTokenHash(body.token)) {
          throw new AppError("ACCESS_DENIED");
        }
        bookingId = row.id;
      }

      await db
        .insert(pushSubscriptions)
        .values({
          endpoint: body.endpoint.slice(0, 500),
          p256dh: body.keys.p256dh.slice(0, 200),
          auth: body.keys.auth.slice(0, 200),
          bookingId,
          userAgent: req.headers.get("user-agent")?.slice(0, 200),
        })
        .onConflictDoUpdate({
          target: pushSubscriptions.endpoint,
          set: {
            p256dh: body.keys.p256dh.slice(0, 200),
            auth: body.keys.auth.slice(0, 200),
            bookingId,
            active: true,
            updatedAt: new Date(),
          },
        });
      return ok({ subscribed: true });
    }

    if (head === "contact") {
      await rateLimit(`contact:${clientIp(req)}`, 6, 600);
      const body = await readJson<{ name: string; email: string; message: string }>(req);
      if (!body?.name?.trim() || !body?.email?.includes("@") || !body?.message?.trim()) {
        throw new AppError("INVALID_INPUT", "Please complete every field.");
      }
      await db.execute(sql`
        insert into audit_logs (actor_label, action, entity, metadata)
        values ('PUBLIC', 'CONTACT_MESSAGE', 'contact',
          ${JSON.stringify({
            name: body.name.slice(0, 120),
            email: body.email.slice(0, 160),
            message: body.message.slice(0, 2000),
          })}::jsonb)
      `);
      return ok({ received: true }, 201);
    }

    throw new AppError("NOT_FOUND");
  } catch (err) {
    return fail(err, rid);
  }
}
