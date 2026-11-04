import { createClient } from "@supabase/supabase-js";

export const ALLOWED_MEDIA_BUCKETS = [
  "public-media",
  "private-gallery",
  "private-documents",
] as const;

export type MediaBucket = (typeof ALLOWED_MEDIA_BUCKETS)[number];

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
}

function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
}

function getSupabaseServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

export function getSupabaseBrowser() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) throw new Error("Supabase browser configuration is missing.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export function getSupabaseAdmin() {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceKey();
  if (!url || !key) throw new Error("Supabase storage is not configured.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export function isBucketAllowed(bucket: string): bucket is MediaBucket {
  return ALLOWED_MEDIA_BUCKETS.includes(bucket as MediaBucket);
}

export function getMediaStorageBudgetBytes(): number | null {
  const raw = process.env.MEDIA_STORAGE_BUDGET_BYTES ?? "";
  if (!raw.trim()) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function getMediaStoragePublicUrl(bucket: MediaBucket, path: string) {
  const base = getSupabaseUrl();
  if (!base) return "";
  const clean = path.replace(/^\/+/g, "").replace(/\\/g, "/");
  return `${base}/storage/v1/object/public/${bucket}/${encodeURIComponent(clean)}`;
}

export function parseUploadBucket(scope: string): MediaBucket {
  if (scope === "gallery") return "private-gallery";
  if (scope === "documents") return "private-documents";
  return "public-media";
}