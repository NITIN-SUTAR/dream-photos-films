import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { adminNotifications, bookings, clients, profiles, services } from "@/db/schema";

export interface CreateAdminNotificationInput {
  eventType:
    | "BOOKING_CREATED"
    | "BOOKING_CONFIRMED"
    | "BOOKING_CANCELLED"
    | "BOOKING_REJECTED"
    | "DATE_BLOCKED"
    | "DATE_UNBLOCKED"
    | "PORTFOLIO_PUBLISHED"
    | "FILM_PUBLISHED"
    | "SERVICE_UPDATED"
    | "PACKAGE_UPDATED";
  title: string;
  message: string;
  category?: "BOOKING" | "CALENDAR" | "CONTENT" | "STUDIO";
  entityType?: "booking" | "calendar" | "portfolio" | "film" | "service";
  entityId?: string;
  link?: string;
  roleScope?: "TEAM" | "OWNER";
  dedupeKey?: string;
  metadata?: Record<string, unknown>;
}

export interface AdminNotificationDTO {
  id: string;
  eventType: string;
  title: string;
  message: string;
  category: string;
  entityType: string | null;
  entityId: string | null;
  link: string | null;
  roleScope: string;
  read: boolean;
  readAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

/**
 * Ensures the admin_notifications table exists in Postgres.
 * Safe to run on every startup or request (idempotent).
 */
export async function ensureNotificationTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS admin_notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type text NOT NULL,
      title text NOT NULL,
      message text NOT NULL,
      category text NOT NULL DEFAULT 'BOOKING',
      entity_type text,
      entity_id text,
      link text,
      role_scope text NOT NULL DEFAULT 'TEAM',
      read boolean NOT NULL DEFAULT false,
      read_at timestamp with time zone,
      read_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
      dedupe_key text UNIQUE,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamp with time zone NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS admin_notifications_created_idx ON admin_notifications (created_at DESC);
    CREATE INDEX IF NOT EXISTS admin_notifications_read_idx ON admin_notifications (read, role_scope);
    CREATE INDEX IF NOT EXISTS admin_notifications_dedupe_idx ON admin_notifications (dedupe_key);
  `);
}

/**
 * Creates a persistent in-app notification.
 * Protected against duplicate insertions via unique dedupeKey.
 */
export async function recordAdminNotification(input: CreateAdminNotificationInput) {
  try {
    const [row] = await db
      .insert(adminNotifications)
      .values({
        eventType: input.eventType,
        title: input.title,
        message: input.message,
        category: input.category ?? "BOOKING",
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        link: input.link ?? null,
        roleScope: input.roleScope ?? "TEAM",
        dedupeKey: input.dedupeKey ?? null,
        metadata: input.metadata ?? {},
      })
      .onConflictDoNothing({ target: adminNotifications.dedupeKey })
      .returning();

    if (!row && input.dedupeKey) {
      const [existing] = await db
        .select()
        .from(adminNotifications)
        .where(eq(adminNotifications.dedupeKey, input.dedupeKey))
        .limit(1);
      return existing ?? null;
    }

    return row ?? null;
  } catch (err) {
    console.warn("[notification] Failed to record notification:", (err as Error).message);
    return null;
  }
}

/**
 * Fetches notifications and unread count for the given user role.
 * TEAM role is restricted from viewing OWNER-only notifications.
 */
export async function listAdminNotifications(
  userRole: "OWNER" | "TEAM",
  limit = 50,
): Promise<{ notifications: AdminNotificationDTO[]; unreadCount: number }> {
  await ensureNotificationTable();

  const roleCondition =
    userRole === "OWNER" ? undefined : eq(adminNotifications.roleScope, "TEAM");

  const rows = await db
    .select()
    .from(adminNotifications)
    .where(roleCondition)
    .orderBy(desc(adminNotifications.createdAt))
    .limit(limit);

  const unreadRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(adminNotifications)
    .where(
      and(
        eq(adminNotifications.read, false),
        userRole === "OWNER" ? undefined : eq(adminNotifications.roleScope, "TEAM"),
      ),
    );

  return {
    notifications: rows.map((r) => ({
      id: r.id,
      eventType: r.eventType,
      title: r.title,
      message: r.message,
      category: r.category,
      entityType: r.entityType,
      entityId: r.entityId,
      link: r.link,
      roleScope: r.roleScope,
      read: r.read,
      readAt: r.readAt?.toISOString() ?? null,
      metadata: (r.metadata as Record<string, unknown>) ?? {},
      createdAt: r.createdAt.toISOString(),
    })),
    unreadCount: unreadRows[0]?.count ?? 0,
  };
}

/**
 * Marks one or all notifications as read.
 */
export async function markAdminNotificationsRead(options: {
  userId: string;
  userRole: "OWNER" | "TEAM";
  id?: string;
  all?: boolean;
}): Promise<{ success: boolean; unreadCount: number }> {
  await ensureNotificationTable();
  const now = new Date();

  const isValidUuid =
    typeof options.userId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(options.userId);
  const readByVal = isValidUuid ? options.userId : null;

  if (options.all) {
    const condition =
      options.userRole === "OWNER"
        ? eq(adminNotifications.read, false)
        : and(eq(adminNotifications.read, false), eq(adminNotifications.roleScope, "TEAM"));

    await db
      .update(adminNotifications)
      .set({ read: true, readAt: now, readBy: readByVal })
      .where(condition);
  } else if (options.id) {
    await db
      .update(adminNotifications)
      .set({ read: true, readAt: now, readBy: readByVal })
      .where(eq(adminNotifications.id, options.id));
  }

  const result = await listAdminNotifications(options.userRole);
  return { success: true, unreadCount: result.unreadCount };
}

/**
 * Seeds initial historical notifications from real database records
 * if the notifications table is empty. Idempotent and deduplicated.
 */
export async function backfillExistingNotificationsIfEmpty() {
  await ensureNotificationTable();

  const countRow = await db.execute<{ count: string }>(
    sql`select count(*)::text from admin_notifications`,
  );
  if (Number(countRow.rows[0]?.count ?? 0) > 0) {
    return;
  }

  // Backfill from actual existing bookings
  const existingBookings = await db
    .select({
      id: bookings.id,
      bookingNumber: bookings.bookingNumber,
      status: bookings.status,
      createdAt: bookings.createdAt,
      clientName: clients.name,
      serviceName: services.name,
    })
    .from(bookings)
    .innerJoin(clients, eq(clients.id, bookings.clientId))
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .orderBy(desc(bookings.createdAt))
    .limit(20);

  for (const b of existingBookings) {
    const dateFormatted = b.createdAt.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // 1. Initial submission
    await recordAdminNotification({
      eventType: "BOOKING_CREATED",
      title: b.clientName,
      message: `${b.bookingNumber} · ${dateFormatted}`,
      category: "BOOKING",
      entityType: "booking",
      entityId: b.bookingNumber,
      link: "/admin/bookings",
      roleScope: "TEAM",
      dedupeKey: `booking:created:${b.bookingNumber}`,
      metadata: {
        bookingNumber: b.bookingNumber,
        clientName: b.clientName,
        serviceName: b.serviceName,
        status: b.status,
      },
    });

    // 2. Status change if confirmed/cancelled
    if (b.status === "CONFIRMED") {
      await recordAdminNotification({
        eventType: "BOOKING_CONFIRMED",
        title: "Studio",
        message: `confirmed booking ${b.bookingNumber} (${b.clientName})`,
        category: "BOOKING",
        entityType: "booking",
        entityId: b.bookingNumber,
        link: "/admin/bookings",
        roleScope: "TEAM",
        dedupeKey: `booking:status:${b.bookingNumber}:CONFIRMED`,
        metadata: {
          bookingNumber: b.bookingNumber,
          clientName: b.clientName,
          status: "CONFIRMED",
        },
      });
    } else if (b.status === "CANCELLED") {
      await recordAdminNotification({
        eventType: "BOOKING_CANCELLED",
        title: "Studio",
        message: `cancelled booking ${b.bookingNumber} (${b.clientName})`,
        category: "BOOKING",
        entityType: "booking",
        entityId: b.bookingNumber,
        link: "/admin/bookings",
        roleScope: "TEAM",
        dedupeKey: `booking:status:${b.bookingNumber}:CANCELLED`,
        metadata: {
          bookingNumber: b.bookingNumber,
          clientName: b.clientName,
          status: "CANCELLED",
        },
      });
    }
  }
}
