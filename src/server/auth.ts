import { cookies } from "next/headers";
import {
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { profiles, sessions, auditLogs } from "@/db/schema";
import { AppError, sha256 } from "./http";

export { signMediaPath, verifyMediaSignature } from "./mediaSigning";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

export const SESSION_COOKIE = "dpf_session";
const SESSION_DAYS = 7;

export type Role = "OWNER" | "TEAM";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/* --------------------------- password hashing -------------------------- */

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, keyHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;
  const key = await scrypt(password, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(keyHex, "hex");
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/* ------------------------------ sessions ------------------------------- */

export async function createSession(profileId: string, userAgent?: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.insert(sessions).values({
    tokenHash: sha256(token),
    profileId,
    userAgent: userAgent?.slice(0, 200),
    expiresAt,
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
  jar.delete(SESSION_COOKIE);
}

/** Returns the authenticated admin profile, or null. Role is always read from the database. */
export async function currentUser(): Promise<AuthUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({
      id: profiles.id,
      email: profiles.email,
      name: profiles.name,
      role: profiles.role,
      active: profiles.active,
    })
    .from(sessions)
    .innerJoin(profiles, eq(profiles.id, sessions.profileId))
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const row = rows[0];
  if (!row || !row.active) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role as Role };
}

export async function requireUser(): Promise<AuthUser> {
  const user = await currentUser();
  if (!user) throw new AppError("UNAUTHORIZED");
  return user;
}

/** OWNER-only operations: catalogue + content + settings management. */
export async function requireOwner(): Promise<AuthUser> {
  const user = await requireUser();
  if (user.role !== "OWNER") throw new AppError("FORBIDDEN");
  return user;
}

export async function audit(entry: {
  actorId?: string | null;
  actorLabel?: string;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  requestId?: string;
}) {
  await db.insert(auditLogs).values({
    actorId: entry.actorId ?? null,
    actorLabel: entry.actorLabel ?? "SYSTEM",
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId ?? null,
    metadata: entry.metadata ?? {},
    requestId: entry.requestId ?? null,
  });
}

/* --------------------------- booking tokens ---------------------------- */

export function createBookingToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: sha256(token) };
}

export function bookingTokenHash(token: string): string {
  return sha256(token);
}

