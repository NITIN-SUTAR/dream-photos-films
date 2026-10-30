import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  date,
  jsonb,
  numeric,
  index,
  uniqueIndex,
  check,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/* auth / profiles                                                     */
/* ------------------------------------------------------------------ */

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull().default("TEAM"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("profiles_email_key").on(sql`lower(${t.email})`),
    check("profiles_role_check", sql`${t.role} in ('OWNER','TEAM')`),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("sessions_profile_idx").on(t.profileId)],
);

/* ------------------------------------------------------------------ */
/* catalogue                                                           */
/* ------------------------------------------------------------------ */

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("INR"),
    priceNote: text("price_note").notNull().default(""),
    category: text("category").notNull().default("Signature"),
    bookingType: text("booking_type").notNull().default("SINGLE_OR_RANGE"),
    details: jsonb("details").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    imageUrl: text("image_url"),
    imageAlt: text("image_alt"),
    active: boolean("active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("services_slug_key").on(t.slug),
    index("services_active_order_idx").on(t.active, t.displayOrder),
    check("services_price_check", sql`${t.price} >= 0`),
    check("services_category_check", sql`${t.category} in ('Signature','Add-on')`),
  ],
);

export const packages = pgTable(
  "packages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    highlight: text("highlight"),
    active: boolean("active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("packages_code_key").on(t.code),
    index("packages_service_idx").on(t.serviceId, t.active, t.displayOrder),
  ],
);

export const packageInclusions = pgTable(
  "package_inclusions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    packageId: uuid("package_id")
      .notNull()
      .references(() => packages.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (t) => [index("package_inclusions_pkg_idx").on(t.packageId, t.displayOrder)],
);

export const packageOptions = pgTable(
  "package_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    packageId: uuid("package_id")
      .notNull()
      .references(() => packages.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // WITH_ALBUM | WITHOUT_ALBUM
    label: text("label").notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    active: boolean("active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (t) => [
    uniqueIndex("package_options_pkg_kind_key").on(t.packageId, t.kind),
    check("package_options_price_check", sql`${t.price} >= 0`),
    check("package_options_kind_check", sql`${t.kind} in ('WITH_ALBUM','WITHOUT_ALBUM')`),
  ],
);

export const extras = pgTable(
  "extras",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("INR"),
    groupName: text("group_name").notNull().default("Additional Services"),
    active: boolean("active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("extras_active_order_idx").on(t.active, t.displayOrder),
    check("extras_price_check", sql`${t.price} >= 0`),
  ],
);

export const serviceExtras = pgTable(
  "service_extras",
  {
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    extraId: uuid("extra_id")
      .notNull()
      .references(() => extras.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.serviceId, t.extraId] }),
    index("service_extras_extra_idx").on(t.extraId),
  ],
);

/* ------------------------------------------------------------------ */
/* clients + bookings                                                  */
/* ------------------------------------------------------------------ */

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    district: text("district").notNull().default(""),
    city: text("city").notNull().default(""),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("clients_email_key").on(sql`lower(${t.email})`),
    index("clients_phone_idx").on(t.phone),
  ],
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingNumber: text("booking_number").notNull(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict" }),
    packageId: uuid("package_id").references(() => packages.id, { onDelete: "restrict" }),
    packageOptionId: uuid("package_option_id").references(() => packageOptions.id, {
      onDelete: "restrict",
    }),
    eventStartDate: date("event_start_date").notNull(),
    eventEndDate: date("event_end_date").notNull(),
    budget: text("budget").notNull().default(""),
    visionNotes: text("vision_notes").notNull().default(""),
    basePrice: numeric("base_price", { precision: 12, scale: 2 }).notNull(),
    extrasTotal: numeric("extras_total", { precision: 12, scale: 2 }).notNull(),
    totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("INR"),
    pricingSnapshot: jsonb("pricing_snapshot").notNull(),
    status: text("status").notNull().default("PENDING"),
    accessTokenHash: text("access_token_hash").notNull(),
    accessTokenCreatedAt: timestamp("access_token_created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    expiredAt: timestamp("expired_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("bookings_number_key").on(t.bookingNumber),
    index("bookings_status_idx").on(t.status),
    index("bookings_client_idx").on(t.clientId),
    index("bookings_service_idx").on(t.serviceId),
    index("bookings_created_idx").on(t.createdAt),
    index("bookings_start_idx").on(t.eventStartDate),
    check(
      "bookings_status_check",
      sql`${t.status} in ('PENDING','CONFIRMED','REJECTED','CANCELLED','EXPIRED')`,
    ),
    check("bookings_dates_check", sql`${t.eventStartDate} <= ${t.eventEndDate}`),
    check("bookings_total_check", sql`${t.totalPrice} >= 0`),
  ],
);

export const bookingDates = pgTable(
  "booking_dates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    eventDate: date("event_date").notNull(),
    active: boolean("active").notNull().default(true),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("booking_dates_booking_idx").on(t.bookingId),
    index("booking_dates_date_idx").on(t.eventDate),
    uniqueIndex("booking_dates_active_unique")
      .on(t.eventDate)
      .where(sql`${t.active}`),
  ],
);

export const bookingExtras = pgTable(
  "booking_extras",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    extraId: uuid("extra_id").references(() => extras.id, { onDelete: "restrict" }),
    nameSnapshot: text("name_snapshot").notNull(),
    priceSnapshot: numeric("price_snapshot", { precision: 12, scale: 2 }).notNull(),
  },
  (t) => [
    uniqueIndex("booking_extras_unique").on(t.bookingId, t.extraId),
    index("booking_extras_booking_idx").on(t.bookingId),
  ],
);

export const bookingStatusHistory = pgTable(
  "booking_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    oldStatus: text("old_status"),
    newStatus: text("new_status").notNull(),
    actor: text("actor").notNull().default("SYSTEM"),
    actorId: uuid("actor_id"),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("booking_status_history_booking_idx").on(t.bookingId, t.createdAt)],
);

export const blockedDates = pgTable(
  "blocked_dates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    blockedDate: date("blocked_date").notNull(),
    reason: text("reason").notNull().default(""),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("blocked_dates_date_key").on(t.blockedDate)],
);

/* ------------------------------------------------------------------ */
/* content                                                             */
/* ------------------------------------------------------------------ */

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bucket: text("bucket").notNull().default("public-media"),
    storagePath: text("storage_path").notNull(),
    mediaType: text("media_type").notNull().default("IMAGE"),
    mimeType: text("mime_type").notNull(),
    fileSize: bigint("file_size", { mode: "number" }).notNull().default(0),
    width: integer("width"),
    height: integer("height"),
    durationSeconds: numeric("duration_seconds", { precision: 10, scale: 2 }),
    status: text("status").notNull().default("UPLOADING"),
    originalName: text("original_name").notNull().default(""),
    checksum: text("checksum"),
    failureReason: text("failure_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("media_assets_path_key").on(t.bucket, t.storagePath),
    index("media_assets_status_idx").on(t.status),
    check(
      "media_assets_status_check",
      sql`${t.status} in ('UPLOADING','PROCESSING','READY','FAILED')`,
    ),
    check("media_assets_bucket_check", sql`${t.bucket} in ('public-media','private-gallery','private-documents')`),
  ],
);

export const mediaVariants = pgTable(
  "media_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    variant: text("variant").notNull(),
    storagePath: text("storage_path").notNull(),
    width: integer("width"),
    height: integer("height"),
    fileSize: bigint("file_size", { mode: "number" }).notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("media_variants_unique").on(t.assetId, t.variant)],
);

export const portfolioItems = pgTable(
  "portfolio_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url").notNull(),
    imageAlt: text("image_alt").notNull().default(""),
    mediaAssetId: uuid("media_asset_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    width: integer("width").notNull().default(1200),
    height: integer("height").notNull().default(800),
    location: text("location"),
    year: integer("year"),
    featured: boolean("featured").notNull().default(false),
    active: boolean("active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("portfolio_category_idx").on(t.category),
    index("portfolio_active_order_idx").on(t.active, t.displayOrder),
    check(
      "portfolio_category_check",
      sql`${t.category} in ('Wedding','Pre-Wedding','Events','Portrait','Baby Shower','Editorial')`,
    ),
  ],
);

export const films = pgTable(
  "films",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    description: text("description").notNull().default(""),
    videoUrl: text("video_url").notNull(),
    posterUrl: text("poster_url").notNull(),
    posterAlt: text("poster_alt").notNull().default(""),
    posterWidth: integer("poster_width").notNull().default(1500),
    posterHeight: integer("poster_height").notNull().default(844),
    videoAssetId: uuid("video_asset_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    posterAssetId: uuid("poster_asset_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    duration: text("duration").notNull().default("0:00"),
    featured: boolean("featured").notNull().default(false),
    active: boolean("active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("films_category_idx").on(t.category),
    index("films_active_order_idx").on(t.active, t.displayOrder),
    check(
      "films_category_check",
      sql`${t.category} in ('Wedding Films','Pre-Wedding Films','Event Films','Short Cinematic Films')`,
    ),
  ],
);

export const testimonials = pgTable(
  "testimonials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    quote: text("quote").notNull(),
    event: text("event").notNull().default(""),
    location: text("location").notNull().default(""),
    rating: integer("rating").notNull().default(5),
    imageUrl: text("image_url"),
    imageAlt: text("image_alt"),
    featured: boolean("featured").notNull().default(false),
    active: boolean("active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("testimonials_active_order_idx").on(t.active, t.displayOrder),
    check("testimonials_rating_check", sql`${t.rating} between 1 and 5`),
  ],
);

export const galleryAlbums = pgTable(
  "gallery_albums",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    clientName: text("client_name").notNull().default(""),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
    event: text("event").notNull().default(""),
    eventDate: date("event_date"),
    location: text("location").notNull().default(""),
    coverUrl: text("cover_url"),
    coverAlt: text("cover_alt"),
    active: boolean("active").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("gallery_albums_slug_key").on(t.slug)],
);

export const galleryPhotos = pgTable(
  "gallery_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    albumId: uuid("album_id")
      .notNull()
      .references(() => galleryAlbums.id, { onDelete: "cascade" }),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
    mediaAssetId: uuid("media_asset_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    storagePath: text("storage_path"),
    externalUrl: text("external_url"),
    alt: text("alt").notNull().default(""),
    width: integer("width").notNull().default(1200),
    height: integer("height").notNull().default(800),
    displayOrder: integer("display_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("gallery_photos_album_idx").on(t.albumId, t.displayOrder),
    index("gallery_photos_booking_idx").on(t.bookingId),
  ],
);

/* ------------------------------------------------------------------ */
/* notifications / ops                                                 */
/* ------------------------------------------------------------------ */

export const notificationEvents = pgTable(
  "notification_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    channel: text("channel").notNull(),
    recipient: text("recipient").notNull(),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    status: text("status").notNull().default("PENDING"),
    attempts: integer("attempts").notNull().default(0),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("notification_events_unique").on(
      t.bookingId,
      t.eventType,
      t.channel,
      t.recipient,
    ),
    index("notification_events_status_idx").on(t.status, t.createdAt),
    check(
      "notification_events_status_check",
      sql`${t.status} in ('PENDING','SENDING','SENT','FAILED','SKIPPED')`,
    ),
    check("notification_events_channel_check", sql`${t.channel} in ('EMAIL','PUSH')`),
  ],
);

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "cascade" }),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }),
    userAgent: text("user_agent"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("push_subscriptions_endpoint_key").on(t.endpoint)],
);

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid("updated_by").references(() => profiles.id, { onDelete: "set null" }),
});

export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    key: text("key").primaryKey(),
    requestHash: text("request_hash").notNull(),
    scope: text("scope").notNull().default("create-booking"),
    resultRef: text("result_ref"),
    resultPayload: jsonb("result_payload"),
    status: text("status").notNull().default("IN_PROGRESS"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idempotency_created_idx").on(t.createdAt)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => profiles.id, { onDelete: "set null" }),
    actorLabel: text("actor_label").notNull().default("SYSTEM"),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    requestId: text("request_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_logs_created_idx").on(t.createdAt), index("audit_logs_entity_idx").on(t.entity, t.entityId)],
);

export const rateLimits = pgTable(
  "rate_limits",
  {
    bucketKey: text("bucket_key").primaryKey(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
    count: integer("count").notNull().default(0),
  },
  (t) => [index("rate_limits_window_idx").on(t.windowStart)],
);

export const adminNotifications = pgTable(
  "admin_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventType: text("event_type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    category: text("category").notNull().default("BOOKING"),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    link: text("link"),
    roleScope: text("role_scope").notNull().default("TEAM"),
    read: boolean("read").notNull().default(false),
    readAt: timestamp("read_at", { withTimezone: true }),
    readBy: uuid("read_by").references(() => profiles.id, { onDelete: "set null" }),
    dedupeKey: text("dedupe_key"),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("admin_notifications_dedupe_idx").on(t.dedupeKey),
    index("admin_notifications_created_idx").on(t.createdAt),
    index("admin_notifications_read_idx").on(t.read, t.roleScope),
  ],
);

