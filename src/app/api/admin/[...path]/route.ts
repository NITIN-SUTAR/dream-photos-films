import { NextRequest } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  appSettings,
  blockedDates,
  bookings,
  clients,
  extras,
  films,
  galleryAlbums,
  galleryPhotos,
  packageInclusions,
  packageOptions,
  packages,
  portfolioItems,
  profiles,
  serviceExtras,
  services,
  testimonials,
} from "@/db/schema";
import {
  AppError,
  clientIp,
  fail,
  isISODate,
  isUuid,
  num,
  ok,
  rateLimit,
  readJson,
  requestId,
  str,
} from "@/server/http";
import {
  audit,
  createSession,
  currentUser,
  destroySession,
  requireOwner,
  requireUser,
  verifyPassword,
  type AuthUser,
} from "@/server/auth";
import {
  getAdminCalendar,
  getBookingDetail,
  getClientDetail,
  getDashboard,
  getSettings,
  listBookings,
  listClients,
  listExtras,
  listFilms,
  listGalleryAlbums,
  listPackages,
  listPortfolio,
  listServices,
  listTestimonials,
} from "@/server/repositories";
import { deleteMediaAsset, publicMediaUrl, storeUpload } from "@/server/media";
import {
  backfillExistingNotificationsIfEmpty,
  listAdminNotifications,
  markAdminNotificationsRead,
  recordAdminNotification,
} from "@/server/notifications";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ path: string[] }> };

const OWNER_ENTITIES = new Set([
  "services",
  "packages",
  "extras",
  "portfolio",
  "films",
  "testimonials",
  "gallery-albums",
  "gallery-photos",
  "settings",
  "media",
]);

async function guard(entity: string): Promise<AuthUser> {
  return OWNER_ENTITIES.has(entity) ? requireOwner() : requireUser();
}

/* ----------------------------------- GET ---------------------------------- */

export async function GET(req: NextRequest, ctx: Ctx) {
  const rid = requestId();
  try {
    const { path } = await ctx.params;
    const [head, second, third] = path;
    const q = req.nextUrl.searchParams;

    if (head === "auth" && second === "session") {
      const user = await currentUser();
      return ok({ user });
    }

    const user = await guard(head);

    switch (head) {
      case "dashboard":
        return ok(await getDashboard());

      case "notifications": {
        await backfillExistingNotificationsIfEmpty();
        return ok(await listAdminNotifications(user.role));
      }

      case "bookings": {
        if (second) {
          const detail = await getBookingDetail(second);
          if (!detail) throw new AppError("BOOKING_NOT_FOUND");
          return ok(detail);
        }
        return ok({
          bookings: await listBookings({
            status: q.get("status") ?? undefined,
            serviceId: q.get("serviceId") ?? undefined,
            search: q.get("search") ?? undefined,
            limit: 200,
          }),
        });
      }

      case "clients": {
        if (second) {
          const detail = await getClientDetail(second);
          if (!detail) throw new AppError("NOT_FOUND");
          return ok(detail);
        }
        return ok({ clients: await listClients(q.get("search") ?? undefined) });
      }

      case "calendar": {
        const from = q.get("from");
        const to = q.get("to");
        if (!isISODate(from) || !isISODate(to)) throw new AppError("INVALID_INPUT");
        return ok(await getAdminCalendar(from, to));
      }

      case "services":
        return ok({ services: await listServices(false) });
      case "packages":
        return ok({ packages: await listPackages(false), services: await listServices(false) });
      case "extras":
        return ok({ extras: await listExtras(false), services: await listServices(false) });
      case "portfolio":
        return ok({ portfolio: await listPortfolio(false) });
      case "films":
        return ok({ films: await listFilms(false) });
      case "testimonials":
        return ok({ testimonials: await listTestimonials(false) });
      case "gallery-albums": {
        if (second && third === "photos") {
          const photos = await db
            .select()
            .from(galleryPhotos)
            .where(eq(galleryPhotos.albumId, second))
            .orderBy(asc(galleryPhotos.displayOrder));
          return ok({
            photos: photos.map((p) => ({
              id: p.id,
              src: p.externalUrl ?? publicMediaUrl("private-gallery", p.storagePath ?? ""),
              alt: p.alt,
              width: p.width,
              height: p.height,
              displayOrder: p.displayOrder,
              active: p.active,
            })),
          });
        }
        return ok({ albums: await listGalleryAlbums(false) });
      }
      case "settings":
        return ok({ settings: await getSettings(), role: user.role });
      default:
        throw new AppError("NOT_FOUND");
    }
  } catch (err) {
    return fail(err, rid);
  }
}

/* ---------------------------------- POST ---------------------------------- */

export async function POST(req: NextRequest, ctx: Ctx) {
  const rid = requestId();
  try {
    const { path } = await ctx.params;
    const [head, second, third] = path;

    /* ----- auth ----- */
    if (head === "auth" && second === "login") {
      await rateLimit(`login:${clientIp(req)}`, 10, 300);
      const body = await readJson<{ email: string; password: string }>(req);
      const email = str(body?.email, "Email", 160, 3).toLowerCase();
      const password = str(body?.password, "Password", 200, 6);
      const [profile] = await db
        .select()
        .from(profiles)
        .where(sql`lower(${profiles.email}) = ${email}`)
        .limit(1);
      if (!profile || !profile.active || !(await verifyPassword(password, profile.passwordHash))) {
        throw new AppError("UNAUTHORIZED", "Those credentials were not accepted.");
      }
      await createSession(profile.id, req.headers.get("user-agent") ?? undefined);
      await audit({
        actorId: profile.id,
        actorLabel: profile.email,
        action: "ADMIN_LOGIN",
        entity: "profiles",
        entityId: profile.id,
        requestId: rid,
      });
      return ok({
        user: { id: profile.id, email: profile.email, name: profile.name, role: profile.role },
      });
    }

    if (head === "auth" && second === "logout") {
      await destroySession();
      return ok({ signedOut: true });
    }

    const user = await guard(head);

    /* ----- notifications mark-read ----- */
    if (head === "notifications" && second === "mark-read") {
      const body = await readJson<{ id?: string; all?: boolean }>(req);
      const res = await markAdminNotificationsRead({
        userId: user.id,
        userRole: user.role,
        id: body?.id,
        all: body?.all,
      });
      return ok(res);
    }

    /* ----- booking status machine ----- */
    if (head === "bookings" && second && third === "status") {
      const body = await readJson<{ action: string; reason?: string }>(req);
      const map: Record<string, string> = {
        confirm: "CONFIRMED",
        reject: "REJECTED",
        cancel: "CANCELLED",
      };
      const next = map[body?.action ?? ""];
      if (!next) throw new AppError("INVALID_INPUT", "Unknown booking action.");
      const [row] = await db
        .select({ id: bookings.id })
        .from(bookings)
        .where(eq(bookings.bookingNumber, second))
        .limit(1);
      if (!row) throw new AppError("BOOKING_NOT_FOUND");
      await db.execute(sql`
        select change_booking_status(${row.id}::uuid, ${next}, 'ADMIN', ${user.id}::uuid,
          ${body?.reason?.slice(0, 300) ?? null})
      `);
      await audit({
        actorId: user.id,
        actorLabel: user.email,
        action: `BOOKING_${next}`,
        entity: "bookings",
        entityId: second,
        requestId: rid,
      });

      const detail = await getBookingDetail(second);
      const actionVerb =
        next === "CONFIRMED" ? "confirmed" : next === "REJECTED" ? "declined" : "cancelled";
      await recordAdminNotification({
        eventType: `BOOKING_${next}` as Parameters<typeof recordAdminNotification>[0]["eventType"],
        title: "Studio",
        message: `${actionVerb} booking ${second}${detail?.clientName ? ` (${detail.clientName})` : ""}`,
        category: "BOOKING",
        entityType: "booking",
        entityId: second,
        link: "/admin/bookings",
        roleScope: "TEAM",
        dedupeKey: `booking:status:${second}:${next}`,
        metadata: {
          bookingNumber: second,
          clientName: detail?.clientName ?? "",
          status: next,
          reason: body?.reason ?? null,
        },
      });

      return ok(detail);
    }

    /* ----- calendar ----- */
    if (head === "calendar" && (second === "block" || second === "unblock")) {
      const body = await readJson<{ date: string; reason?: string }>(req);
      if (!isISODate(body?.date)) throw new AppError("INVALID_INPUT", "A valid date is required.");
      if (second === "block") {
        await db.execute(sql`
          select block_date(${body.date}::date, ${body.reason ?? ""}, ${user.id}::uuid)
        `);
      } else {
        await db.execute(sql`select unblock_date(${body.date}::date)`);
      }
      await audit({
        actorId: user.id,
        actorLabel: user.email,
        action: second === "block" ? "DATE_BLOCKED" : "DATE_UNBLOCKED",
        entity: "blocked_dates",
        entityId: body.date,
        requestId: rid,
      });

      const dateFormatted = new Date(body.date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      await recordAdminNotification({
        eventType: second === "block" ? "DATE_BLOCKED" : "DATE_UNBLOCKED",
        title: "Studio",
        message: `${second === "block" ? "blocked" : "unblocked"} calendar date ${dateFormatted}${body.reason ? ` (${body.reason})` : ""}`,
        category: "CALENDAR",
        entityType: "calendar",
        entityId: body.date,
        link: "/admin/calendar",
        roleScope: "TEAM",
        dedupeKey: `calendar:${second}:${body.date}:${new Date().toISOString().slice(0, 16)}`,
        metadata: {
          date: body.date,
          action: second,
          reason: body.reason ?? null,
        },
      });

      return ok({ date: body.date, state: second === "block" ? "blocked" : "available" });
    }

    /* ----- media upload (owner only) ----- */
    if (head === "media") {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) throw new AppError("INVALID_INPUT", "A file is required.");
      const kind = form.get("kind") === "VIDEO" ? "VIDEO" : "IMAGE";
      const scope = String(form.get("scope") ?? "portfolio");
      const bucket = scope === "gallery" ? "private-gallery" : "public-media";
      const stored = await storeUpload({ file, bucket, prefix: scope, kind });
      await audit({
        actorId: user.id,
        actorLabel: user.email,
        action: "MEDIA_UPLOADED",
        entity: "media_assets",
        entityId: stored.assetId,
        metadata: { bucket, size: stored.fileSize },
        requestId: rid,
      });
      return ok(
        {
          assetId: stored.assetId,
          url: publicMediaUrl(stored.bucket, stored.storagePath),
          storagePath: stored.storagePath,
          bucket: stored.bucket,
          width: stored.width,
          height: stored.height,
          status: stored.status,
        },
        201,
      );
    }

    /* ----- catalogue + content creation ----- */
    const body = await readJson<Record<string, unknown>>(req);

    switch (head) {
      case "services": {
        const [row] = await db
          .insert(services)
          .values({
            slug:
              str(body.slug ?? body.name, "Slug", 80, 2)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-") + `-${Date.now().toString(36).slice(-4)}`,
            name: str(body.name, "Name", 120, 2),
            description: str(body.description ?? "", "Description", 2000),
            price: String(num(body.price, "Price")),
            priceNote: str(body.priceNote ?? "", "Price note", 120),
            category: body.category === "Signature" ? "Signature" : "Add-on",
            details: Array.isArray(body.details) ? (body.details as string[]).slice(0, 12) : [],
            active: body.active !== false,
            displayOrder: Number(body.displayOrder ?? 99),
          })
          .returning();
        await audit({ actorId: user.id, actorLabel: user.email, action: "SERVICE_CREATED", entity: "services", entityId: row.id, requestId: rid });
        return ok(row, 201);
      }

      case "packages": {
        const serviceId = String(body.serviceId ?? "");
        if (!isUuid(serviceId)) throw new AppError("INVALID_INPUT", "Choose a service.");
        const [row] = await db
          .insert(packages)
          .values({
            serviceId,
            code: str(body.code ?? `PACKAGE ${Date.now().toString().slice(-3)}`, "Code", 40, 2),
            name: str(body.name, "Name", 120, 2),
            description: str(body.description ?? "", "Description", 2000),
            active: body.active !== false,
            displayOrder: Number(body.displayOrder ?? 99),
          })
          .returning();
        const inclusions = Array.isArray(body.inclusions) ? (body.inclusions as string[]) : [];
        if (inclusions.length) {
          await db.insert(packageInclusions).values(
            inclusions.slice(0, 20).map((label, i) => ({
              packageId: row.id,
              label: label.slice(0, 160),
              displayOrder: i + 1,
            })),
          );
        }
        await db.insert(packageOptions).values([
          { packageId: row.id, kind: "WITH_ALBUM", label: "With album", price: String(num(body.withAlbum ?? 0, "Album price")), displayOrder: 1 },
          { packageId: row.id, kind: "WITHOUT_ALBUM", label: "Without album", price: String(num(body.withoutAlbum ?? 0, "Price")), displayOrder: 2 },
        ]);
        await audit({ actorId: user.id, actorLabel: user.email, action: "PACKAGE_CREATED", entity: "packages", entityId: row.id, requestId: rid });
        return ok(row, 201);
      }

      case "extras": {
        const [row] = await db
          .insert(extras)
          .values({
            name: str(body.name, "Name", 120, 2),
            description: str(body.description ?? "", "Description", 1000),
            price: String(num(body.price, "Price")),
            groupName: str(body.group ?? "Additional Services", "Group", 60),
            active: body.active !== false,
            displayOrder: Number(body.displayOrder ?? 99),
          })
          .returning();
        const serviceIds = Array.isArray(body.serviceIds) ? (body.serviceIds as string[]) : [];
        const valid = serviceIds.filter(isUuid);
        if (valid.length) {
          await db
            .insert(serviceExtras)
            .values(valid.map((serviceId) => ({ serviceId, extraId: row.id })))
            .onConflictDoNothing();
        }
        await audit({ actorId: user.id, actorLabel: user.email, action: "EXTRA_CREATED", entity: "extras", entityId: row.id, requestId: rid });
        return ok(row, 201);
      }

      case "portfolio": {
        const [row] = await db
          .insert(portfolioItems)
          .values({
            title: str(body.title, "Title", 160, 2),
            category: str(body.category, "Category", 40, 2),
            description: str(body.description ?? "", "Description", 2000),
            imageUrl: str(body.imageUrl, "Image", 600, 4),
            imageAlt: str(body.imageAlt ?? body.title, "Alt text", 300),
            mediaAssetId: isUuid(body.assetId) ? (body.assetId as string) : null,
            width: Number(body.width ?? 1200),
            height: Number(body.height ?? 800),
            location: body.location ? str(body.location, "Location", 160) : null,
            year: body.year ? Number(body.year) : null,
            featured: body.featured === true,
            active: body.active !== false,
            displayOrder: Number(body.displayOrder ?? 99),
          })
          .returning();
        await audit({ actorId: user.id, actorLabel: user.email, action: "PORTFOLIO_CREATED", entity: "portfolio_items", entityId: row.id, requestId: rid });
        await recordAdminNotification({
          eventType: "PORTFOLIO_PUBLISHED",
          title: "Studio",
          message: `published portfolio photograph: ${row.title}`,
          category: "CONTENT",
          entityType: "portfolio",
          entityId: row.id,
          link: "/admin/portfolio",
          roleScope: "OWNER",
          dedupeKey: `portfolio:create:${row.id}`,
          metadata: { id: row.id, title: row.title, category: row.category },
        });
        return ok(row, 201);
      }

      case "films": {
        const [row] = await db
          .insert(films)
          .values({
            title: str(body.title, "Title", 160, 2),
            category: str(body.category, "Category", 40, 2),
            description: str(body.description ?? "", "Description", 2000),
            videoUrl: str(body.videoUrl, "Video", 600, 4),
            posterUrl: str(body.posterUrl, "Poster", 600, 4),
            posterAlt: str(body.posterAlt ?? body.title, "Alt text", 300),
            posterWidth: Number(body.posterWidth ?? 1500),
            posterHeight: Number(body.posterHeight ?? 844),
            duration: str(body.duration ?? "0:00", "Duration", 12),
            featured: body.featured === true,
            active: body.active !== false,
            displayOrder: Number(body.displayOrder ?? 99),
          })
          .returning();
        await audit({ actorId: user.id, actorLabel: user.email, action: "FILM_CREATED", entity: "films", entityId: row.id, requestId: rid });
        await recordAdminNotification({
          eventType: "FILM_PUBLISHED",
          title: "Studio",
          message: `published film: ${row.title}`,
          category: "CONTENT",
          entityType: "film",
          entityId: row.id,
          link: "/admin/films",
          roleScope: "OWNER",
          dedupeKey: `film:create:${row.id}`,
          metadata: { id: row.id, title: row.title, duration: row.duration },
        });
        return ok(row, 201);
      }

      case "testimonials": {
        const [row] = await db
          .insert(testimonials)
          .values({
            name: str(body.name, "Name", 120, 2),
            quote: str(body.quote, "Testimonial", 1500, 10),
            event: str(body.event ?? "", "Event", 160),
            location: str(body.location ?? "", "Location", 160),
            rating: Math.min(5, Math.max(1, Number(body.rating ?? 5))),
            featured: body.featured === true,
            active: body.active !== false,
            displayOrder: Number(body.displayOrder ?? 99),
          })
          .returning();
        await audit({ actorId: user.id, actorLabel: user.email, action: "TESTIMONIAL_CREATED", entity: "testimonials", entityId: row.id, requestId: rid });
        return ok(row, 201);
      }

      case "gallery-albums": {
        if (second && third === "photos") {
          const [row] = await db
            .insert(galleryPhotos)
            .values({
              albumId: second,
              mediaAssetId: isUuid(body.assetId) ? (body.assetId as string) : null,
              storagePath: body.storagePath ? String(body.storagePath).slice(0, 400) : null,
              externalUrl: body.externalUrl ? String(body.externalUrl).slice(0, 600) : null,
              alt: str(body.alt ?? "Gallery photograph", "Alt text", 300),
              width: Number(body.width ?? 1200),
              height: Number(body.height ?? 800),
              displayOrder: Number(body.displayOrder ?? 99),
            })
            .returning();
          await audit({ actorId: user.id, actorLabel: user.email, action: "GALLERY_PHOTO_ADDED", entity: "gallery_photos", entityId: row.id, requestId: rid });
          return ok(row, 201);
        }
        const [row] = await db
          .insert(galleryAlbums)
          .values({
            slug:
              str(body.slug ?? body.title, "Slug", 80, 2)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-") + `-${Date.now().toString(36).slice(-4)}`,
            title: str(body.title, "Title", 160, 2),
            clientName: str(body.client ?? "", "Client", 160),
            event: str(body.event ?? "", "Event", 160),
            eventDate: isISODate(body.date) ? (body.date as string) : null,
            location: str(body.location ?? "", "Location", 160),
            coverUrl: body.coverUrl ? String(body.coverUrl).slice(0, 600) : null,
            active: body.active === true,
          })
          .returning();
        await audit({ actorId: user.id, actorLabel: user.email, action: "GALLERY_ALBUM_CREATED", entity: "gallery_albums", entityId: row.id, requestId: rid });
        return ok(row, 201);
      }

      default:
        throw new AppError("NOT_FOUND");
    }
  } catch (err) {
    return fail(err, rid);
  }
}

/* ---------------------------------- PATCH --------------------------------- */

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const rid = requestId();
  try {
    const { path } = await ctx.params;
    const [head, second] = path;
    const user = await guard(head);
    const body = await readJson<Record<string, unknown>>(req);

    if (head === "settings") {
      const entries = Object.entries(body ?? {}).slice(0, 40);
      for (const [key, value] of entries) {
        if (!/^[a-z0-9_]{2,40}$/.test(key)) continue;
        if (key.includes("key") || key.includes("secret") || key.includes("token")) continue;
        await db
          .insert(appSettings)
          .values({ key, value: value as never, updatedBy: user.id })
          .onConflictDoUpdate({
            target: appSettings.key,
            set: { value: value as never, updatedAt: new Date(), updatedBy: user.id },
          });
      }
      await audit({ actorId: user.id, actorLabel: user.email, action: "SETTINGS_UPDATED", entity: "app_settings", requestId: rid });
      return ok({ settings: await getSettings() });
    }

    if (!second || !isUuid(second)) throw new AppError("INVALID_INPUT");
    const now = new Date();

    switch (head) {
      case "services": {
        const patch: Record<string, unknown> = { updatedAt: now };
        if (body.name !== undefined) patch.name = str(body.name, "Name", 120, 2);
        if (body.description !== undefined) patch.description = str(body.description, "Description", 2000);
        if (body.price !== undefined) patch.price = String(num(body.price, "Price"));
        if (body.priceNote !== undefined) patch.priceNote = str(body.priceNote, "Price note", 120);
        if (body.active !== undefined) patch.active = !!body.active;
        if (body.displayOrder !== undefined) patch.displayOrder = Number(body.displayOrder);
        const [row] = await db.update(services).set(patch).where(eq(services.id, second)).returning();
        await audit({ actorId: user.id, actorLabel: user.email, action: "SERVICE_UPDATED", entity: "services", entityId: second, requestId: rid });
        return ok(row);
      }
      case "packages": {
        const patch: Record<string, unknown> = { updatedAt: now };
        for (const k of ["name", "description", "code"] as const) {
          if (body[k] !== undefined) patch[k] = str(body[k], k, 300, 1);
        }
        if (body.serviceId !== undefined && isUuid(body.serviceId)) patch.serviceId = body.serviceId;
        if (body.active !== undefined) patch.active = !!body.active;
        if (body.displayOrder !== undefined) patch.displayOrder = Number(body.displayOrder);
        const [row] = await db.update(packages).set(patch).where(eq(packages.id, second)).returning();
        if (Array.isArray(body.inclusions)) {
          await db.delete(packageInclusions).where(eq(packageInclusions.packageId, second));
          const list = (body.inclusions as string[]).filter(Boolean).slice(0, 20);
          if (list.length) {
            await db.insert(packageInclusions).values(
              list.map((label, i) => ({ packageId: second, label: label.slice(0, 160), displayOrder: i + 1 })),
            );
          }
        }
        for (const [kind, key] of [["WITH_ALBUM", "withAlbum"], ["WITHOUT_ALBUM", "withoutAlbum"]] as const) {
          if (body[key] !== undefined) {
            await db
              .insert(packageOptions)
              .values({
                packageId: second,
                kind,
                label: kind === "WITH_ALBUM" ? "With album" : "Without album",
                price: String(num(body[key], key)),
              })
              .onConflictDoUpdate({
                target: [packageOptions.packageId, packageOptions.kind],
                set: { price: String(num(body[key], key)) },
              });
          }
        }
        await audit({ actorId: user.id, actorLabel: user.email, action: "PACKAGE_UPDATED", entity: "packages", entityId: second, requestId: rid });
        return ok(row);
      }
      case "extras": {
        const patch: Record<string, unknown> = { updatedAt: now };
        if (body.name !== undefined) patch.name = str(body.name, "Name", 120, 2);
        if (body.description !== undefined) patch.description = str(body.description, "Description", 1000);
        if (body.price !== undefined) patch.price = String(num(body.price, "Price"));
        if (body.group !== undefined) patch.groupName = str(body.group, "Group", 60);
        if (body.active !== undefined) patch.active = !!body.active;
        if (body.displayOrder !== undefined) patch.displayOrder = Number(body.displayOrder);
        const [row] = await db.update(extras).set(patch).where(eq(extras.id, second)).returning();
        if (Array.isArray(body.serviceIds)) {
          await db.delete(serviceExtras).where(eq(serviceExtras.extraId, second));
          const valid = (body.serviceIds as string[]).filter(isUuid);
          if (valid.length) {
            await db
              .insert(serviceExtras)
              .values(valid.map((serviceId) => ({ serviceId, extraId: second })))
              .onConflictDoNothing();
          }
        }
        await audit({ actorId: user.id, actorLabel: user.email, action: "EXTRA_UPDATED", entity: "extras", entityId: second, requestId: rid });
        return ok(row);
      }
      case "portfolio": {
        const patch: Record<string, unknown> = { updatedAt: now };
        if (body.title !== undefined) patch.title = str(body.title, "Title", 160, 2);
        if (body.category !== undefined) patch.category = str(body.category, "Category", 40, 2);
        if (body.description !== undefined) patch.description = str(body.description, "Description", 2000);
        if (body.imageUrl !== undefined) patch.imageUrl = str(body.imageUrl, "Image", 600, 4);
        if (body.featured !== undefined) patch.featured = !!body.featured;
        if (body.active !== undefined) patch.active = !!body.active;
        if (body.displayOrder !== undefined) patch.displayOrder = Number(body.displayOrder);
        const [row] = await db.update(portfolioItems).set(patch).where(eq(portfolioItems.id, second)).returning();
        await audit({ actorId: user.id, actorLabel: user.email, action: "PORTFOLIO_UPDATED", entity: "portfolio_items", entityId: second, requestId: rid });
        return ok(row);
      }
      case "films": {
        const patch: Record<string, unknown> = { updatedAt: now };
        if (body.title !== undefined) patch.title = str(body.title, "Title", 160, 2);
        if (body.category !== undefined) patch.category = str(body.category, "Category", 40, 2);
        if (body.description !== undefined) patch.description = str(body.description, "Description", 2000);
        if (body.duration !== undefined) patch.duration = str(body.duration, "Duration", 12);
        if (body.videoUrl !== undefined) patch.videoUrl = str(body.videoUrl, "Video", 600, 4);
        if (body.posterUrl !== undefined) patch.posterUrl = str(body.posterUrl, "Poster", 600, 4);
        if (body.featured !== undefined) patch.featured = !!body.featured;
        if (body.active !== undefined) patch.active = !!body.active;
        if (body.displayOrder !== undefined) patch.displayOrder = Number(body.displayOrder);
        const [row] = await db.update(films).set(patch).where(eq(films.id, second)).returning();
        await audit({ actorId: user.id, actorLabel: user.email, action: "FILM_UPDATED", entity: "films", entityId: second, requestId: rid });
        return ok(row);
      }
      case "testimonials": {
        const patch: Record<string, unknown> = { updatedAt: now };
        if (body.name !== undefined) patch.name = str(body.name, "Name", 120, 2);
        if (body.quote !== undefined) patch.quote = str(body.quote, "Testimonial", 1500, 10);
        if (body.event !== undefined) patch.event = str(body.event, "Event", 160);
        if (body.location !== undefined) patch.location = str(body.location, "Location", 160);
        if (body.rating !== undefined) patch.rating = Math.min(5, Math.max(1, Number(body.rating)));
        if (body.featured !== undefined) patch.featured = !!body.featured;
        if (body.active !== undefined) patch.active = !!body.active;
        if (body.displayOrder !== undefined) patch.displayOrder = Number(body.displayOrder);
        const [row] = await db.update(testimonials).set(patch).where(eq(testimonials.id, second)).returning();
        await audit({ actorId: user.id, actorLabel: user.email, action: "TESTIMONIAL_UPDATED", entity: "testimonials", entityId: second, requestId: rid });
        return ok(row);
      }
      case "gallery-albums": {
        const patch: Record<string, unknown> = { updatedAt: now };
        if (body.title !== undefined) patch.title = str(body.title, "Title", 160, 2);
        if (body.active !== undefined) patch.active = !!body.active;
        const [row] = await db.update(galleryAlbums).set(patch).where(eq(galleryAlbums.id, second)).returning();
        await audit({ actorId: user.id, actorLabel: user.email, action: "GALLERY_ALBUM_UPDATED", entity: "gallery_albums", entityId: second, requestId: rid });
        return ok(row);
      }
      case "gallery-photos": {
        const patch: Record<string, unknown> = {};
        if (body.displayOrder !== undefined) patch.displayOrder = Number(body.displayOrder);
        if (body.active !== undefined) patch.active = !!body.active;
        const [row] = await db.update(galleryPhotos).set(patch).where(eq(galleryPhotos.id, second)).returning();
        return ok(row);
      }
      case "clients": {
        const patch: Record<string, unknown> = { updatedAt: now };
        if (body.notes !== undefined) patch.notes = str(body.notes, "Notes", 2000);
        const [row] = await db.update(clients).set(patch).where(eq(clients.id, second)).returning();
        await audit({ actorId: user.id, actorLabel: user.email, action: "CLIENT_UPDATED", entity: "clients", entityId: second, requestId: rid });
        return ok(row);
      }
      default:
        throw new AppError("NOT_FOUND");
    }
  } catch (err) {
    return fail(err, rid);
  }
}

/* --------------------------------- DELETE --------------------------------- */

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const rid = requestId();
  try {
    const { path } = await ctx.params;
    const [head, second] = path;
    const user = await guard(head);
    if (!second || !isUuid(second)) throw new AppError("INVALID_INPUT");

    // Catalogue records referenced by historical bookings are deactivated,
    // never destroyed, so past bookings stay readable.
    const referenced = async (table: "service_id" | "package_id") => {
      const res = await db.execute<{ c: string }>(
        sql`select count(*)::text as c from bookings where ${sql.raw(table)} = ${second}::uuid`,
      );
      return Number(res.rows[0].c) > 0;
    };

    switch (head) {
      case "services": {
        if (await referenced("service_id")) {
          await db.update(services).set({ active: false }).where(eq(services.id, second));
          await audit({ actorId: user.id, actorLabel: user.email, action: "SERVICE_DEACTIVATED", entity: "services", entityId: second, requestId: rid });
          return ok({ deactivated: true, reason: "referenced-by-bookings" });
        }
        await db.delete(services).where(eq(services.id, second));
        await audit({ actorId: user.id, actorLabel: user.email, action: "SERVICE_DELETED", entity: "services", entityId: second, requestId: rid });
        return ok({ deleted: true });
      }
      case "packages": {
        if (await referenced("package_id")) {
          await db.update(packages).set({ active: false }).where(eq(packages.id, second));
          return ok({ deactivated: true, reason: "referenced-by-bookings" });
        }
        await db.delete(packages).where(eq(packages.id, second));
        await audit({ actorId: user.id, actorLabel: user.email, action: "PACKAGE_DELETED", entity: "packages", entityId: second, requestId: rid });
        return ok({ deleted: true });
      }
      case "extras": {
        const used = await db.execute<{ c: string }>(
          sql`select count(*)::text as c from booking_extras where extra_id = ${second}::uuid`,
        );
        if (Number(used.rows[0].c) > 0) {
          await db.update(extras).set({ active: false }).where(eq(extras.id, second));
          return ok({ deactivated: true, reason: "referenced-by-bookings" });
        }
        await db.delete(extras).where(eq(extras.id, second));
        await audit({ actorId: user.id, actorLabel: user.email, action: "EXTRA_DELETED", entity: "extras", entityId: second, requestId: rid });
        return ok({ deleted: true });
      }
      case "portfolio": {
        const [row] = await db.select().from(portfolioItems).where(eq(portfolioItems.id, second)).limit(1);
        await db.delete(portfolioItems).where(eq(portfolioItems.id, second));
        if (row?.mediaAssetId) await deleteMediaAsset(row.mediaAssetId);
        await audit({ actorId: user.id, actorLabel: user.email, action: "PORTFOLIO_DELETED", entity: "portfolio_items", entityId: second, requestId: rid });
        return ok({ deleted: true });
      }
      case "films": {
        const [row] = await db.select().from(films).where(eq(films.id, second)).limit(1);
        await db.delete(films).where(eq(films.id, second));
        if (row?.videoAssetId) await deleteMediaAsset(row.videoAssetId);
        if (row?.posterAssetId) await deleteMediaAsset(row.posterAssetId);
        await audit({ actorId: user.id, actorLabel: user.email, action: "FILM_DELETED", entity: "films", entityId: second, requestId: rid });
        return ok({ deleted: true });
      }
      case "testimonials": {
        await db.delete(testimonials).where(eq(testimonials.id, second));
        await audit({ actorId: user.id, actorLabel: user.email, action: "TESTIMONIAL_DELETED", entity: "testimonials", entityId: second, requestId: rid });
        return ok({ deleted: true });
      }
      case "gallery-photos": {
        const [row] = await db.select().from(galleryPhotos).where(eq(galleryPhotos.id, second)).limit(1);
        await db.delete(galleryPhotos).where(eq(galleryPhotos.id, second));
        if (row?.mediaAssetId) await deleteMediaAsset(row.mediaAssetId);
        await audit({ actorId: user.id, actorLabel: user.email, action: "GALLERY_PHOTO_DELETED", entity: "gallery_photos", entityId: second, requestId: rid });
        return ok({ deleted: true });
      }
      case "gallery-albums": {
        const photos = await db.select().from(galleryPhotos).where(eq(galleryPhotos.albumId, second));
        await db.delete(galleryAlbums).where(eq(galleryAlbums.id, second));
        for (const p of photos) if (p.mediaAssetId) await deleteMediaAsset(p.mediaAssetId);
        return ok({ deleted: true });
      }
      case "calendar": {
        await db.delete(blockedDates).where(and(eq(blockedDates.id, second)));
        return ok({ deleted: true });
      }
      default:
        throw new AppError("NOT_FOUND");
    }
  } catch (err) {
    return fail(err, rid);
  }
}
