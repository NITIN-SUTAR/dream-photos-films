import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  appSettings,
  blockedDates,
  extras as extrasTable,
  films as filmsTable,
  galleryAlbums,
  galleryPhotos,
  packageInclusions,
  packageOptions,
  packages as packagesTable,
  portfolioItems,
  profiles,
  serviceExtras,
  services as servicesTable,
  testimonials as testimonialsTable,
} from "@/db/schema";
import { EXTRAS, PACKAGES, SERVICES } from "@/lib/seed-data/catalog";
import { FILMS, GALLERY_ALBUMS, PORTFOLIO, TESTIMONIALS } from "@/lib/seed-data/content";
import { SETTINGS, addDays, TODAY } from "@/lib/seed-data/studio";
import { hashPassword, createBookingToken } from "./auth";

/**
 * Idempotent seed. Safe to run repeatedly — every insert is conflict-guarded
 * and the function exits early when the catalogue already exists.
 */
export async function seedDatabase(force = false) {
  const existing = await db.execute<{ count: string }>(sql`select count(*)::text from services`);
  if (Number(existing.rows[0].count) > 0 && !force) {
    return { seeded: false, reason: "already-seeded" as const };
  }

  /* ----------------------------- accounts ----------------------------- */
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "Studio@2026";
  const teamPassword = process.env.SEED_TEAM_PASSWORD ?? "Team@2026";

  await db
    .insert(profiles)
    .values([
      {
        email: "owner@dreamphotosfilms.in",
        passwordHash: await hashPassword(ownerPassword),
        name: "Utkarsh Patel",
        role: "OWNER",
      },
      {
        email: "team@dreamphotosfilms.in",
        passwordHash: await hashPassword(teamPassword),
        name: "Team Member",
        role: "TEAM",
      },
    ])
    .onConflictDoNothing();

  /* ----------------------------- settings ----------------------------- */
  const settingRows: { key: string; value: unknown }[] = [
    { key: "studio_name", value: SETTINGS.studioName },
    { key: "tagline", value: SETTINGS.tagline },
    { key: "studio_email", value: SETTINGS.email },
    { key: "phone", value: SETTINGS.phone },
    { key: "whatsapp", value: SETTINGS.whatsapp },
    { key: "address", value: SETTINGS.address },
    { key: "city", value: SETTINGS.city },
    { key: "instagram", value: SETTINGS.instagram },
    { key: "youtube", value: SETTINGS.youtube },
    { key: "facebook", value: SETTINGS.facebook },
    { key: "timezone", value: SETTINGS.timezone },
    { key: "timezone_iana", value: "Asia/Kolkata" },
    { key: "pending_hold_hours", value: 24 },
    { key: "lead_time_days", value: SETTINGS.leadTimeDays },
    { key: "max_booking_days", value: SETTINGS.maxBookingDays },
    { key: "allow_multi_day", value: SETTINGS.allowMultiDay },
    { key: "show_prices_publicly", value: SETTINGS.showPricesPublicly },
    { key: "maintenance_mode", value: false },
    { key: "watermark", value: SETTINGS.watermark },
    { key: "max_upload_mb", value: SETTINGS.maxUploadMb },
    { key: "image_quality", value: SETTINGS.imageQuality },
  ];
  for (const row of settingRows) {
    await db
      .insert(appSettings)
      .values({ key: row.key, value: row.value as never })
      .onConflictDoUpdate({ target: appSettings.key, set: { value: row.value as never } });
  }

  /* ----------------------------- catalogue ---------------------------- */
  const serviceIdBySlug = new Map<string, string>();
  const serviceIdByMockId = new Map<string, string>();

  for (const s of SERVICES) {
    const [row] = await db
      .insert(servicesTable)
      .values({
        slug: s.slug,
        name: s.name,
        description: s.description,
        price: String(s.price),
        priceNote: s.priceNote,
        category: s.category,
        details: s.details,
        imageUrl: s.image?.src ?? null,
        imageAlt: s.image?.alt ?? null,
        active: s.active,
        displayOrder: s.order,
      })
      .onConflictDoNothing()
      .returning({ id: servicesTable.id });
    if (row) {
      serviceIdBySlug.set(s.slug, row.id);
      serviceIdByMockId.set(s.id, row.id);
    }
  }

  for (const p of PACKAGES) {
    const serviceId = serviceIdByMockId.get(p.serviceId);
    if (!serviceId) continue;
    const [pkg] = await db
      .insert(packagesTable)
      .values({
        serviceId,
        code: p.code,
        name: p.name,
        description: p.description,
        highlight: p.highlight ?? null,
        active: p.active,
        displayOrder: p.order,
      })
      .onConflictDoNothing()
      .returning({ id: packagesTable.id });
    if (!pkg) continue;
    await db.insert(packageInclusions).values(
      p.inclusions.map((label, i) => ({ packageId: pkg.id, label, displayOrder: i + 1 })),
    );
    await db.insert(packageOptions).values([
      {
        packageId: pkg.id,
        kind: "WITH_ALBUM",
        label: "With album",
        price: String(p.pricing.withAlbum),
        displayOrder: 1,
      },
      {
        packageId: pkg.id,
        kind: "WITHOUT_ALBUM",
        label: "Without album",
        price: String(p.pricing.withoutAlbum),
        displayOrder: 2,
      },
    ]);
  }

  for (const e of EXTRAS) {
    const [extra] = await db
      .insert(extrasTable)
      .values({
        name: e.name,
        description: e.description,
        price: String(e.price),
        groupName: e.group,
        active: e.active,
        displayOrder: e.order,
      })
      .onConflictDoNothing()
      .returning({ id: extrasTable.id });
    if (!extra) continue;
    const links = e.appliesTo
      .map((mockId) => serviceIdByMockId.get(mockId))
      .filter((v): v is string => !!v)
      .map((serviceId) => ({ serviceId, extraId: extra.id }));
    if (links.length) await db.insert(serviceExtras).values(links).onConflictDoNothing();
  }

  /* ------------------------------ content ----------------------------- */
  await db.insert(portfolioItems).values(
    PORTFOLIO.map((p) => ({
      title: p.title,
      category: p.category,
      description: p.description,
      imageUrl: p.image.src,
      imageAlt: p.image.alt,
      width: p.image.width,
      height: p.image.height,
      location: p.location ?? null,
      year: p.year ?? null,
      featured: p.featured,
      active: p.active,
      displayOrder: p.order,
    })),
  );

  await db.insert(filmsTable).values(
    FILMS.map((f) => ({
      title: f.title,
      category: f.category,
      description: f.description,
      videoUrl: f.video,
      posterUrl: f.poster.src,
      posterAlt: f.poster.alt,
      posterWidth: f.poster.width,
      posterHeight: f.poster.height,
      duration: f.duration,
      featured: f.featured,
      active: f.active,
      displayOrder: f.order,
    })),
  );

  await db.insert(testimonialsTable).values(
    TESTIMONIALS.map((t) => ({
      name: t.name,
      quote: t.quote,
      event: t.event,
      location: t.location,
      rating: t.rating,
      imageUrl: t.image?.src ?? null,
      imageAlt: t.image?.alt ?? null,
      featured: t.featured,
      active: t.active,
      displayOrder: t.order,
    })),
  );

  for (const a of GALLERY_ALBUMS) {
    const [album] = await db
      .insert(galleryAlbums)
      .values({
        slug: a.slug,
        title: a.title,
        clientName: a.client,
        event: a.event,
        eventDate: a.date,
        location: a.location,
        coverUrl: a.cover.src,
        coverAlt: a.cover.alt,
        active: a.active,
      })
      .onConflictDoNothing()
      .returning({ id: galleryAlbums.id });
    if (!album) continue;
    await db.insert(galleryPhotos).values(
      a.photos.map((p) => ({
        albumId: album.id,
        externalUrl: p.image.src,
        alt: p.image.alt,
        width: p.image.width,
        height: p.image.height,
        displayOrder: p.order,
        active: p.active,
      })),
    );
  }

  /* --------------------------- blocked dates -------------------------- */
  await db
    .insert(blockedDates)
    .values(
      [3, 4, 22, 38].map((offset, i) => ({
        blockedDate: addDays(TODAY, offset),
        reason: ["Studio maintenance", "Studio maintenance", "Team leave", "Personal"][i],
      })),
    )
    .onConflictDoNothing();

  /* ------------------ demo bookings via the real engine ---------------- */
  const weddingId = serviceIdBySlug.get("wedding");
  const eventId = serviceIdBySlug.get("event");
  const pkg3 = await db.execute<{ id: string }>(
    sql`select id from packages where code = 'PACKAGE 03' limit 1`,
  );
  const droneExtra = await db.execute<{ id: string }>(
    sql`select id from extras where name = 'Drone Cinematography' limit 1`,
  );

  if (weddingId && pkg3.rows[0]) {
    const token = createBookingToken();
    await db.execute(sql`
      select create_booking_atomic(${JSON.stringify({
        serviceId: weddingId,
        packageId: pkg3.rows[0].id,
        album: true,
        extras: droneExtra.rows[0] ? [droneExtra.rows[0].id] : [],
        dates: [addDays(TODAY, 6), addDays(TODAY, 7), addDays(TODAY, 8)],
        client: {
          name: "Meera Deshpande",
          email: "meera.deshpande@example.com",
          phone: "+91 98204 41201",
          district: "Nashik",
          city: "Gangapur Road, Nashik",
        },
        budget: "₹75,000 – ₹1,20,000",
        notes: "Three-day coverage. Haldi at home, wedding at Gondeshwar Grounds.",
        accessTokenHash: token.hash,
      })}::jsonb)
    `);
    await db.execute(sql`
      select change_booking_status(
        (select id from bookings order by created_at desc limit 1),
        'CONFIRMED', 'SYSTEM', null, 'Seeded demonstration booking'
      )
    `);
  }

  if (eventId) {
    const token = createBookingToken();
    await db.execute(sql`
      select create_booking_atomic(${JSON.stringify({
        serviceId: eventId,
        extras: [],
        dates: [addDays(TODAY, 19)],
        client: {
          name: "Kunal Bhosale",
          email: "kunal.b@example.com",
          phone: "+91 90284 11733",
          district: "Pune",
          city: "Kalyani Nagar, Pune",
        },
        budget: "Under ₹40,000",
        notes: "Corporate annual evening, 5pm to 11pm, indoor low light.",
        accessTokenHash: token.hash,
      })}::jsonb)
    `);
  }

  return { seeded: true as const };
}
