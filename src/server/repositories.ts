import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  appSettings,
  blockedDates,
  bookingExtras,
  bookingStatusHistory,
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
  serviceExtras,
  services,
  testimonials,
} from "@/db/schema";

/* ------------------------------------------------------------------ */
/* shared response contracts                                           */
/* ------------------------------------------------------------------ */

export interface ServiceDTO {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  priceNote: string;
  category: "Signature" | "Add-on";
  details: string[];
  image: { src: string; alt: string } | null;
  active: boolean;
  displayOrder: number;
}

export interface PackageOptionDTO {
  id: string;
  kind: "WITH_ALBUM" | "WITHOUT_ALBUM";
  label: string;
  price: number;
}

export interface PackageDTO {
  id: string;
  serviceId: string;
  code: string;
  name: string;
  description: string;
  highlight: string | null;
  inclusions: string[];
  options: PackageOptionDTO[];
  active: boolean;
  displayOrder: number;
}

export interface ExtraDTO {
  id: string;
  name: string;
  description: string;
  price: number;
  group: string;
  serviceIds: string[];
  active: boolean;
  displayOrder: number;
}

export interface PortfolioDTO {
  id: string;
  title: string;
  category: string;
  description: string;
  image: { src: string; alt: string; width: number; height: number };
  location: string | null;
  year: number | null;
  featured: boolean;
  active: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface FilmDTO {
  id: string;
  title: string;
  category: string;
  description: string;
  video: string;
  poster: { src: string; alt: string; width: number; height: number };
  duration: string;
  featured: boolean;
  active: boolean;
  displayOrder: number;
}

export interface TestimonialDTO {
  id: string;
  name: string;
  quote: string;
  event: string;
  location: string;
  rating: number;
  image: { src: string; alt: string } | null;
  featured: boolean;
  active: boolean;
  displayOrder: number;
}

const n = (v: string | number | null) => Number(v ?? 0);

/* ------------------------------------------------------------------ */
/* catalogue                                                           */
/* ------------------------------------------------------------------ */

export async function listServices(onlyActive = true): Promise<ServiceDTO[]> {
  const rows = await db
    .select()
    .from(services)
    .where(onlyActive ? eq(services.active, true) : sql`true`)
    .orderBy(asc(services.displayOrder));
  return rows.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    description: s.description,
    price: n(s.price),
    priceNote: s.priceNote,
    category: s.category as ServiceDTO["category"],
    details: (s.details as string[]) ?? [],
    image: s.imageUrl ? { src: s.imageUrl, alt: s.imageAlt ?? s.name } : null,
    active: s.active,
    displayOrder: s.displayOrder,
  }));
}

export async function listPackages(onlyActive = true): Promise<PackageDTO[]> {
  const rows = await db
    .select()
    .from(packages)
    .where(onlyActive ? eq(packages.active, true) : sql`true`)
    .orderBy(asc(packages.displayOrder));
  if (!rows.length) return [];
  const incl = await db.select().from(packageInclusions).orderBy(asc(packageInclusions.displayOrder));
  const opts = await db.select().from(packageOptions).orderBy(asc(packageOptions.displayOrder));
  return rows.map((p) => ({
    id: p.id,
    serviceId: p.serviceId,
    code: p.code,
    name: p.name,
    description: p.description,
    highlight: p.highlight,
    inclusions: incl.filter((i) => i.packageId === p.id).map((i) => i.label),
    options: opts
      .filter((o) => o.packageId === p.id && o.active)
      .map((o) => ({
        id: o.id,
        kind: o.kind as PackageOptionDTO["kind"],
        label: o.label,
        price: n(o.price),
      })),
    active: p.active,
    displayOrder: p.displayOrder,
  }));
}

export async function listExtras(onlyActive = true): Promise<ExtraDTO[]> {
  const rows = await db
    .select()
    .from(extras)
    .where(onlyActive ? eq(extras.active, true) : sql`true`)
    .orderBy(asc(extras.displayOrder));
  const links = await db.select().from(serviceExtras);
  return rows.map((e) => ({
    id: e.id,
    name: e.name,
    description: e.description,
    price: n(e.price),
    group: e.groupName,
    serviceIds: links.filter((l) => l.extraId === e.id).map((l) => l.serviceId),
    active: e.active,
    displayOrder: e.displayOrder,
  }));
}

export async function listPortfolio(onlyActive = true): Promise<PortfolioDTO[]> {
  const rows = await db
    .select()
    .from(portfolioItems)
    .where(onlyActive ? eq(portfolioItems.active, true) : sql`true`)
    .orderBy(asc(portfolioItems.displayOrder));
  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    description: p.description,
    image: { src: p.imageUrl, alt: p.imageAlt, width: p.width, height: p.height },
    location: p.location,
    year: p.year,
    featured: p.featured,
    active: p.active,
    displayOrder: p.displayOrder,
    createdAt: p.createdAt.toISOString().slice(0, 10),
    updatedAt: p.updatedAt.toISOString().slice(0, 10),
  }));
}

export async function listFilms(onlyActive = true): Promise<FilmDTO[]> {
  const rows = await db
    .select()
    .from(films)
    .where(onlyActive ? eq(films.active, true) : sql`true`)
    .orderBy(asc(films.displayOrder));
  return rows.map((f) => ({
    id: f.id,
    title: f.title,
    category: f.category,
    description: f.description,
    video: f.videoUrl,
    poster: {
      src: f.posterUrl,
      alt: f.posterAlt,
      width: f.posterWidth,
      height: f.posterHeight,
    },
    duration: f.duration,
    featured: f.featured,
    active: f.active,
    displayOrder: f.displayOrder,
  }));
}

export async function listTestimonials(onlyActive = true): Promise<TestimonialDTO[]> {
  const rows = await db
    .select()
    .from(testimonials)
    .where(onlyActive ? eq(testimonials.active, true) : sql`true`)
    .orderBy(asc(testimonials.displayOrder));
  return rows.map((t) => ({
    id: t.id,
    name: t.name,
    quote: t.quote,
    event: t.event,
    location: t.location,
    rating: t.rating,
    image: t.imageUrl ? { src: t.imageUrl, alt: t.imageAlt ?? t.name } : null,
    featured: t.featured,
    active: t.active,
    displayOrder: t.displayOrder,
  }));
}

/* ------------------------------------------------------------------ */
/* settings                                                            */
/* ------------------------------------------------------------------ */

export async function getSettings(): Promise<Record<string, unknown>> {
  const rows = await db.select().from(appSettings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export interface StudioContact {
  studioName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  instagram: string;
  youtube: string;
  facebook: string;
}

export async function getStudioContact(): Promise<StudioContact> {
  const s = await getSettings();
  const get = (k: string, fallback: string) =>
    typeof s[k] === "string" ? (s[k] as string) : fallback;
  return {
    studioName: get("studio_name", "DREAM PHOTO'S & FILM'S"),
    phone: get("phone", "+91 98765 43210"),
    whatsapp: get("whatsapp", "+91 98765 43210"),
    email: get("studio_email", "studio@dreamphotosfilms.in"),
    address: get("address", "Unit 4, Panch Pakhadi, Thane West"),
    city: get("city", "Thane, Maharashtra 400602"),
    instagram: get("instagram", "https://instagram.com/dreamphotosfilms"),
    youtube: get("youtube", "https://youtube.com/@dreamphotosfilms"),
    facebook: get("facebook", "https://facebook.com/dreamphotosfilms"),
  };
}

/* ------------------------------------------------------------------ */
/* availability                                                        */
/* ------------------------------------------------------------------ */

export interface AvailabilityDay {
  date: string;
  state: "available" | "pending" | "confirmed" | "blocked";
  label: string | null;
}

export async function getAvailability(from: string, to: string): Promise<AvailabilityDay[]> {
  const res = await db.execute<{ day: string; state: string; label: string | null }>(sql`
    select to_char(day, 'YYYY-MM-DD') as day, state, label
      from get_availability(${from}::date, ${to}::date)
  `);
  return res.rows.map((r) => ({
    date: r.day,
    state: r.state as AvailabilityDay["state"],
    label: r.label,
  }));
}

/* ------------------------------------------------------------------ */
/* bookings (admin + client views)                                     */
/* ------------------------------------------------------------------ */

export interface BookingListRow {
  id: string;
  bookingNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  city: string;
  serviceName: string;
  serviceId: string;
  packageName: string | null;
  dates: string[];
  estimate: number;
  status: string;
  createdAt: string;
}

export async function listBookings(filters: {
  status?: string;
  serviceId?: string;
  search?: string;
  limit?: number;
}): Promise<BookingListRow[]> {
  const res = await db.execute<{
    id: string;
    booking_number: string;
    client_name: string;
    client_email: string;
    client_phone: string;
    city: string;
    service_name: string;
    service_id: string;
    package_name: string | null;
    dates: string[];
    estimate: string;
    status: string;
    created_at: string;
  }>(sql`
    select b.id, b.booking_number, c.name as client_name, c.email as client_email,
           c.phone as client_phone, c.city, s.name as service_name, s.id as service_id,
           case when p.id is null then null else p.code || ' — ' || p.name end as package_name,
           coalesce((select array_agg(to_char(bd.event_date,'YYYY-MM-DD') order by bd.event_date)
                       from booking_dates bd where bd.booking_id = b.id), '{}') as dates,
           b.total_price::text as estimate, b.status,
           to_char(b.created_at, 'YYYY-MM-DD') as created_at
      from bookings b
      join clients c on c.id = b.client_id
      join services s on s.id = b.service_id
      left join packages p on p.id = b.package_id
     where (${filters.status ?? null}::text is null or b.status = ${filters.status ?? null})
       and (${filters.serviceId ?? null}::uuid is null or b.service_id = ${filters.serviceId ?? null}::uuid)
       and (
         ${filters.search ?? null}::text is null
         or b.booking_number ilike '%' || ${filters.search ?? null} || '%'
         or c.name ilike '%' || ${filters.search ?? null} || '%'
         or c.email ilike '%' || ${filters.search ?? null} || '%'
         or c.phone ilike '%' || ${filters.search ?? null} || '%'
         or c.city ilike '%' || ${filters.search ?? null} || '%'
       )
     order by b.created_at desc
     limit ${filters.limit ?? 100}
  `);
  return res.rows.map((r) => ({
    id: r.id,
    bookingNumber: r.booking_number,
    clientName: r.client_name,
    clientEmail: r.client_email,
    clientPhone: r.client_phone,
    city: r.city,
    serviceName: r.service_name,
    serviceId: r.service_id,
    packageName: r.package_name,
    dates: r.dates ?? [],
    estimate: Number(r.estimate),
    status: r.status,
    createdAt: r.created_at,
  }));
}

export interface BookingDetail extends BookingListRow {
  district: string;
  album: string | null;
  baseAmount: number;
  extrasAmount: number;
  notes: string;
  budget: string;
  extras: { id: string; name: string; price: number }[];
  timeline: {
    id: string;
    label: string;
    at: string;
    state: string;
    note: string | null;
  }[];
  expiresAt: string | null;
}

export async function getBookingDetail(bookingNumber: string): Promise<BookingDetail | null> {
  const rows = await db
    .select({
      b: bookings,
      c: clients,
      s: services,
      p: packages,
      o: packageOptions,
    })
    .from(bookings)
    .innerJoin(clients, eq(clients.id, bookings.clientId))
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .leftJoin(packages, eq(packages.id, bookings.packageId))
    .leftJoin(packageOptions, eq(packageOptions.id, bookings.packageOptionId))
    .where(eq(bookings.bookingNumber, bookingNumber))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  const dateRows = await db.execute<{ d: string }>(sql`
    select to_char(event_date,'YYYY-MM-DD') as d from booking_dates
     where booking_id = ${row.b.id} order by event_date
  `);
  const extraRows = await db
    .select()
    .from(bookingExtras)
    .where(eq(bookingExtras.bookingId, row.b.id));
  const history = await db
    .select()
    .from(bookingStatusHistory)
    .where(eq(bookingStatusHistory.bookingId, row.b.id))
    .orderBy(asc(bookingStatusHistory.createdAt));

  const label = (h: (typeof history)[number]) => {
    if (!h.oldStatus) return "Request submitted";
    switch (h.newStatus) {
      case "CONFIRMED":
        return "Booking confirmed";
      case "REJECTED":
        return "Request declined";
      case "CANCELLED":
        return "Booking cancelled";
      case "EXPIRED":
        return "Request expired";
      default:
        return `Status changed to ${h.newStatus}`;
    }
  };

  return {
    id: row.b.id,
    bookingNumber: row.b.bookingNumber,
    clientName: row.c.name,
    clientEmail: row.c.email,
    clientPhone: row.c.phone,
    district: row.c.district,
    city: row.c.city,
    serviceId: row.s.id,
    serviceName: row.s.name,
    packageName: row.p ? `${row.p.code} — ${row.p.name}` : null,
    album: row.o?.label ?? null,
    dates: dateRows.rows.map((d) => d.d),
    baseAmount: n(row.b.basePrice),
    extrasAmount: n(row.b.extrasTotal),
    estimate: n(row.b.totalPrice),
    status: row.b.status,
    notes: row.b.visionNotes,
    budget: row.b.budget,
    createdAt: row.b.createdAt.toISOString().slice(0, 10),
    expiresAt: row.b.expiresAt?.toISOString() ?? null,
    extras: extraRows.map((e) => ({
      id: e.id,
      name: e.nameSnapshot,
      price: n(e.priceSnapshot),
    })),
    timeline: history.map((h) => ({
      id: h.id,
      label: label(h),
      at: h.createdAt.toISOString().slice(0, 10),
      state: h.newStatus,
      note: h.reason,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* clients                                                             */
/* ------------------------------------------------------------------ */

export async function listClients(search?: string) {
  const res = await db.execute<{
    id: string;
    name: string;
    email: string;
    phone: string;
    district: string;
    city: string;
    notes: string;
    booking_count: string;
    latest_booking: string | null;
    lifetime_value: string;
  }>(sql`
    select c.id, c.name, c.email, c.phone, c.district, c.city, c.notes,
           count(b.id)::text as booking_count,
           (select booking_number from bookings b2 where b2.client_id = c.id
             order by created_at desc limit 1) as latest_booking,
           coalesce(sum(case when b.status = 'CONFIRMED' then b.total_price else 0 end), 0)::text
             as lifetime_value
      from clients c
      left join bookings b on b.client_id = c.id
     where (${search ?? null}::text is null
            or c.name ilike '%' || ${search ?? null} || '%'
            or c.email ilike '%' || ${search ?? null} || '%'
            or c.phone ilike '%' || ${search ?? null} || '%'
            or c.city ilike '%' || ${search ?? null} || '%')
     group by c.id
     order by max(b.created_at) desc nulls last, c.created_at desc
     limit 200
  `);
  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    district: r.district,
    city: r.city,
    notes: r.notes,
    bookingCount: Number(r.booking_count),
    latestBooking: r.latest_booking,
    lifetimeValue: Number(r.lifetime_value),
  }));
}

export async function getClientDetail(id: string) {
  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  if (!client) return null;
  const history = await listBookings({ limit: 50 });
  return {
    ...client,
    bookings: history.filter((b) => b.clientEmail === client.email),
  };
}

/* ------------------------------------------------------------------ */
/* dashboard                                                           */
/* ------------------------------------------------------------------ */

export async function getDashboard() {
  const stats = await db.execute<{ get_dashboard_stats: Record<string, unknown> }>(
    sql`select get_dashboard_stats()`,
  );
  const upcoming = await db.execute<{
    booking_number: string;
    client_name: string;
    service_name: string;
    first_date: string;
    days: number;
    estimate: string;
    status: string;
  }>(sql`
    select b.booking_number, c.name as client_name, s.name as service_name,
           to_char(min(bd.event_date), 'YYYY-MM-DD') as first_date,
           count(bd.id)::int as days, b.total_price::text as estimate, b.status
      from bookings b
      join clients c on c.id = b.client_id
      join services s on s.id = b.service_id
      join booking_dates bd on bd.booking_id = b.id and bd.active
     where b.status = 'CONFIRMED' and bd.event_date >= dpf_business_today()
     group by b.id, c.name, s.name
     order by min(bd.event_date)
     limit 6
  `);
  const pending = await listBookings({ status: "PENDING", limit: 6 });
  const activity = await db.execute<{
    id: string;
    action: string;
    entity: string;
    entity_id: string | null;
    actor_label: string;
    created_at: string;
  }>(sql`
    select id, action, entity, entity_id, actor_label,
           to_char(created_at, 'YYYY-MM-DD') as created_at
      from audit_logs order by created_at desc limit 8
  `);

  return {
    stats: stats.rows[0].get_dashboard_stats,
    upcoming: upcoming.rows.map((u) => ({
      bookingNumber: u.booking_number,
      clientName: u.client_name,
      serviceName: u.service_name,
      firstDate: u.first_date,
      days: u.days,
      estimate: Number(u.estimate),
      status: u.status,
    })),
    pending,
    activity: activity.rows.map((a) => ({
      id: a.id,
      label: `${a.action.replaceAll("_", " ").toLowerCase()} · ${a.entity}`,
      meta: a.entity_id ?? a.actor_label,
      at: a.created_at,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* calendar (admin)                                                    */
/* ------------------------------------------------------------------ */

export async function getAdminCalendar(from: string, to: string) {
  const days = await getAvailability(from, to);
  const details = await db.execute<{
    d: string;
    booking_number: string;
    client_name: string;
    service_name: string;
    status: string;
    estimate: string;
  }>(sql`
    select to_char(bd.event_date,'YYYY-MM-DD') as d, b.booking_number, c.name as client_name,
           s.name as service_name, b.status, b.total_price::text as estimate
      from booking_dates bd
      join bookings b on b.id = bd.booking_id
      join clients c on c.id = b.client_id
      join services s on s.id = b.service_id
     where bd.active and bd.event_date between ${from}::date and ${to}::date
  `);
  const blocked = await db
    .select()
    .from(blockedDates)
    .where(sql`${blockedDates.blockedDate} between ${from}::date and ${to}::date`);
  return {
    days,
    bookings: details.rows.map((r) => ({
      date: r.d,
      bookingNumber: r.booking_number,
      clientName: r.client_name,
      serviceName: r.service_name,
      status: r.status,
      estimate: Number(r.estimate),
    })),
    blocked: blocked.map((b) => ({ date: String(b.blockedDate), reason: b.reason })),
  };
}

/* ------------------------------------------------------------------ */
/* gallery                                                             */
/* ------------------------------------------------------------------ */

export async function listGalleryAlbums(onlyActive = true) {
  const rows = await db
    .select()
    .from(galleryAlbums)
    .where(onlyActive ? eq(galleryAlbums.active, true) : sql`true`)
    .orderBy(desc(galleryAlbums.createdAt));
  const counts = await db.execute<{ album_id: string; c: string }>(sql`
    select album_id, count(*)::text as c from gallery_photos where active group by album_id
  `);
  return rows.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    client: a.clientName,
    event: a.event,
    date: a.eventDate ? String(a.eventDate) : "",
    location: a.location,
    cover: a.coverUrl ? { src: a.coverUrl, alt: a.coverAlt ?? a.title } : null,
    active: a.active,
    photoCount: Number(counts.rows.find((c) => c.album_id === a.id)?.c ?? 0),
  }));
}

export async function getGalleryAlbum(slug: string) {
  const [album] = await db
    .select()
    .from(galleryAlbums)
    .where(eq(galleryAlbums.slug, slug))
    .limit(1);
  if (!album) return null;
  const photos = await db
    .select()
    .from(galleryPhotos)
    .where(and(eq(galleryPhotos.albumId, album.id), eq(galleryPhotos.active, true)))
    .orderBy(asc(galleryPhotos.displayOrder));
  return { album, photos };
}
