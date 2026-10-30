"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface ApiError {
  code: string;
  message: string;
  requestId?: string;
}

export class ApiFailure extends Error {
  code: string;
  requestId?: string;
  constructor(error: ApiError) {
    super(error.message);
    this.code = error.code;
    this.requestId = error.requestId;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, headers, ...rest } = init ?? {};
  const res = await fetch(path, {
    ...rest,
    headers: {
      ...(json !== undefined ? { "content-type": "application/json" } : {}),
      ...(headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    credentials: "same-origin",
  });

  let payload: { ok?: boolean; data?: T; error?: ApiError } | null = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok || !payload?.ok) {
    throw new ApiFailure(
      payload?.error ?? {
        code: res.status === 0 ? "NETWORK" : "INTERNAL_ERROR",
        message: "We could not reach the studio server. Please try again.",
      },
    );
  }
  return payload.data as T;
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, json?: unknown, headers?: Record<string, string>) =>
    request<T>(path, { method: "POST", json, headers }),
  postForm: <T,>(path: string, form: FormData) =>
    request<T>(path, { method: "POST", body: form }),
  patch: <T,>(path: string, json?: unknown) => request<T>(path, { method: "PATCH", json }),
  del: <T,>(path: string) => request<T>(path, { method: "DELETE" }),
};

/** Small data hook with loading / error / refetch, used across the admin CMS. */
export function useApi<T>(path: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!path);
  const [error, setError] = useState<ApiError | null>(null);
  const latest = useRef(0);

  const refetch = useCallback(async () => {
    if (!path) return;
    const ticket = ++latest.current;
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<T>(path);
      if (ticket === latest.current) setData(result);
    } catch (err) {
      if (ticket === latest.current) {
        const e = err as ApiFailure;
        setError({ code: e.code ?? "INTERNAL_ERROR", message: e.message });
      }
    } finally {
      if (ticket === latest.current) setLoading(false);
    }
  }, [path]);

  const depsKey = useMemo(
    () =>
      deps
        .map((dep) => {
          if (dep === null || dep === undefined) return String(dep);
          if (typeof dep === "object") return JSON.stringify(dep) ?? String(dep);
          return String(dep);
        })
        .join("|"),
    [deps],
  );

  useEffect(() => {
    if (!path) return;
    const tim = window.setTimeout(() => {
      void refetch();
    }, 0);
    return () => window.clearTimeout(tim);
  }, [path, refetch, depsKey]);

  return { data, loading, error, refetch, setData };
}

/* ------------------------- shared client contracts ------------------------ */

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

export interface PackageDTO {
  id: string;
  serviceId: string;
  code: string;
  name: string;
  description: string;
  highlight: string | null;
  inclusions: string[];
  options: { id: string; kind: "WITH_ALBUM" | "WITHOUT_ALBUM"; label: string; price: number }[];
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

export type DayState = "available" | "pending" | "confirmed" | "blocked";
export interface AvailabilityDay {
  date: string;
  state: DayState;
  label: string | null;
}

export interface BookingQuote {
  serviceName: string;
  packageName: string | null;
  packageOptionLabel: string | null;
  days: number;
  baseAmount: number;
  extrasAmount: number;
  total: number;
  currency: string;
  extras: { id: string; name: string; price: number }[];
}

export interface BookingView {
  bookingNumber: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED" | "EXPIRED";
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  district: string;
  city: string;
  serviceName: string;
  packageName: string | null;
  album: string | null;
  dates: string[];
  extras: { id: string; name: string; price: number }[];
  baseAmount: number;
  extrasAmount: number;
  estimate: number;
  notes: string;
  budget: string;
  createdAt: string;
  expiresAt: string | null;
  timeline: { id: string; label: string; at: string; state: string; note: string | null }[];
}

export interface AdminBookingRow {
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
  status: BookingView["status"];
  createdAt: string;
}

export interface AdminBookingDetail extends AdminBookingRow {
  district: string;
  album: string | null;
  baseAmount: number;
  extrasAmount: number;
  notes: string;
  budget: string;
  extras: { id: string; name: string; price: number }[];
  timeline: BookingView["timeline"];
  expiresAt: string | null;
}

export interface ClientRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  city: string;
  notes: string;
  bookingCount: number;
  latestBooking: string | null;
  lifetimeValue: number;
}
