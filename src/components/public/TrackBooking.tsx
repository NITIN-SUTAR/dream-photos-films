"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiFailure } from "@/lib/api";

export function TrackBooking() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const input = value.trim();
    let bookingNumber = "";
    let token = "";
    try {
      const url = new URL(input, window.location.origin);
      const m = url.pathname.match(/\/booking\/([^/?#]+)/);
      if (m) bookingNumber = decodeURIComponent(m[1]);
      token = url.searchParams.get("token") ?? "";
    } catch {
      const parts = input.split(/\s+/);
      if (parts.length >= 2) {
        bookingNumber = parts[0];
        token = parts[1];
      } else {
        token = input;
      }
    }
    if (token && !bookingNumber) {
      setLoading(true);
      try {
        const data = await api.get<{ bookingNumber: string }>(
          `/api/public/bookings/resolve?token=${encodeURIComponent(token)}`,
        );
        bookingNumber = data.bookingNumber;
      } catch (err) {
        const e = err as ApiFailure;
        setError(e.message || "We could not verify that booking.");
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }
    if (!bookingNumber || !token) {
      setError("Please paste your private booking status link or booking number with token.");
      return;
    }
    router.push(`/booking/${encodeURIComponent(bookingNumber)}?token=${encodeURIComponent(token)}`);
  }

  return (
    <div className="mt-5 max-w-sm">
      <h3 className="eyebrow">Track Your Booking</h3>
      <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
        Enter your private token to check your booking status.
      </p>
      <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Private booking link or token"
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[12.5px] text-bone placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent/60"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-bone px-4 py-2 text-[12.5px] font-medium text-ink disabled:opacity-60"
        >
          {loading ? "Checking…" : "Check Status"}
        </button>
      </form>
      {error && <p className="mt-2 text-[12px] text-rose-300">{error}</p>}
    </div>
  );
}
