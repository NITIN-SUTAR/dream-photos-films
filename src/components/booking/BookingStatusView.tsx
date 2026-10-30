"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CircleCheck,
  CircleDashed,
  CircleX,
  Clock,
  Hourglass,
  Mail,
  MapPin,
  Phone,
  SearchX,
} from "lucide-react";
import { useApi, type BookingView } from "@/lib/api";

type BookingStatus = BookingView["status"];
import { cn, formatDate, formatINR, relativeTime, STATUS_STYLES } from "@/lib/utils";
import { Button, LoadingSkeleton, StatusIndicator } from "@/components/ui/primitives";
import { pushSupported, subscribeToBookingUpdates } from "@/lib/push";
import { useToast } from "@/components/ui/overlays";
import { BellRing } from "lucide-react";

const STATUS_COPY: Record<BookingStatus, { headline: string; body: string }> = {
  PENDING: {
    headline: "Awaiting studio review",
    body: "We have your request. The studio checks crew availability and replies, usually within 24 hours.",
  },
  CONFIRMED: {
    headline: "Your dates are held",
    body: "The studio has accepted this booking and blocked the dates in the calendar.",
  },
  REJECTED: {
    headline: "We could not take this one",
    body: "The requested window clashed with existing coverage. Talk to us — we may be able to suggest alternatives.",
  },
  CANCELLED: {
    headline: "This booking was cancelled",
    body: "The dates have been released back into the studio calendar.",
  },
  EXPIRED: {
    headline: "This request expired",
    body: "The hold window passed without confirmation, so the dates were released automatically.",
  },
};

const STATUS_ICON: Record<BookingStatus, typeof Clock> = {
  PENDING: Hourglass,
  CONFIRMED: CircleCheck,
  REJECTED: CircleX,
  CANCELLED: CircleDashed,
  EXPIRED: Clock,
};

export function BookingStatusView({ bookingNumber }: { bookingNumber: string }) {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const { push } = useToast();
  const { data: booking, loading, error } = useApi<BookingView>(
    `/api/public/bookings/${encodeURIComponent(bookingNumber)}?token=${encodeURIComponent(token)}`,
  );

  if (loading) {
    return (
      <div className="space-y-4 py-10">
        <LoadingSkeleton className="h-8 w-52" />
        <LoadingSkeleton className="h-40 w-full" />
        <LoadingSkeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!booking) {
    const denied = error?.code === "ACCESS_DENIED";
    return (
      <div className="py-16 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/12 bg-white/[0.03]">
          <SearchX aria-hidden className="h-6 w-6 text-muted" />
        </span>
        <h1 className="display mt-6 text-[clamp(2rem,5vw,3rem)]">
          {denied ? "This private link is not valid" : "No booking found"}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-muted">
          {denied
            ? "Booking details are only visible through the private link sent when the request was submitted. Booking numbers alone never reveal booking information."
            : (error?.message ??
              `We could not find a booking matching ${bookingNumber}.`)}
        </p>
        <Link
          href="/booking"
          className="mt-8 inline-flex h-12 items-center rounded-full bg-bone px-7 text-[14px] font-medium text-ink"
        >
          Start a new request
        </Link>
      </div>
    );
  }

  const Icon = STATUS_ICON[booking.status];
  const copy = STATUS_COPY[booking.status];
  const styles = STATUS_STYLES[booking.status];

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="eyebrow">Booking status</p>
          <h1 className="display mt-3 text-[clamp(2.2rem,5.5vw,3.4rem)] text-bone">
            {booking.bookingNumber}
          </h1>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            Requested {formatDate(booking.createdAt)} · {relativeTime(booking.createdAt)}
          </p>
        </div>
        <StatusIndicator status={booking.status} />
      </header>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "mt-8 flex items-start gap-4 rounded-[16px] border p-5 sm:p-6",
          styles.chip,
        )}
      >
        <Icon aria-hidden className={cn("mt-0.5 h-6 w-6 shrink-0", styles.text)} />
        <div>
          <h2 className="display text-[24px] text-bone">{copy.headline}</h2>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-bone/70">{copy.body}</p>
        </div>
      </motion.div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
        <div className="space-y-6">
          <section className="rounded-[16px] panel p-5 sm:p-6" aria-labelledby="bk-summary">
            <h2 id="bk-summary" className="eyebrow">
              Booking summary
            </h2>
            <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <Row label="Service" value={booking.serviceName} />
              <Row label="Package" value={booking.packageName ?? "—"} />
              <Row label="Album" value={booking.album ? "Included" : "Not included"} />
              <Row
                label={booking.dates.length > 1 ? "Dates" : "Date"}
                value={booking.dates.map((d) => formatDate(d, "short")).join(" · ")}
              />
              <Row label="Total days" value={String(booking.dates.length)} />
              <Row label="Budget band" value={booking.budget} />
            </dl>

            <div className="mt-6 border-t border-white/8 pt-4">
              <h3 className="eyebrow">Extras</h3>
              {booking.extras.length === 0 ? (
                <p className="mt-2 text-[13px] text-muted">No extras selected.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {booking.extras.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between rounded-[8px] border border-white/8 bg-white/[0.02] px-3 py-2 text-[12.5px]"
                    >
                      <span className="text-bone">{e.name}</span>
                      <span className="font-mono text-[11px] text-muted">
                        {formatINR(e.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 rounded-[12px] border border-accent/25 bg-accent/[0.06] p-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                    Estimate
                  </p>
                  <p className="mt-1 text-[11.5px] text-muted">
                    Base {formatINR(booking.baseAmount)} + extras{" "}
                    {formatINR(booking.extrasAmount)}
                  </p>
                </div>
                <p className="display text-[32px] text-bone">{formatINR(booking.estimate)}</p>
              </div>
            </div>
            {booking.notes && (
              <div className="mt-5">
                <h3 className="eyebrow">Your notes</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{booking.notes}</p>
              </div>
            )}
          </section>

          <section className="rounded-[16px] panel p-5 sm:p-6" aria-labelledby="bk-timeline">
            <h2 id="bk-timeline" className="eyebrow">
              Status timeline
            </h2>
            <ol className="mt-5 space-y-0">
              {booking.timeline.map((t, i) => (
                <li key={t.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {i !== booking.timeline.length - 1 && (
                    <span aria-hidden className="absolute left-[7px] top-4 h-full w-px bg-white/10" />
                  )}
                  <span
                    aria-hidden
                    className={cn(
                      "relative mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2",
                      i === booking.timeline.length - 1
                        ? "border-accent bg-accent/30"
                        : "border-white/25 bg-ink",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-[13.5px] text-bone">{t.label}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                      {formatDate(t.at, "short")} · {relativeTime(t.at)}
                    </p>
                    {t.note && (
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{t.note}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="glass rounded-[16px] p-5" aria-label="Client information">
          <p className="eyebrow">Your details</p>
          <ul className="mt-4 space-y-3 text-[13px]">
            <li className="flex items-center gap-2.5 text-bone">
              <span className="text-muted">{booking.clientName}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone aria-hidden className="h-3.5 w-3.5 shrink-0 text-accent" />
              <a href={`tel:${booking.clientPhone}`} className="text-bone hover:text-accent-soft">
                {booking.clientPhone}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail aria-hidden className="h-3.5 w-3.5 shrink-0 text-accent" />
              <a
                href={`mailto:${booking.clientEmail}`}
                className="min-w-0 truncate text-bone hover:text-accent-soft"
              >
                {booking.clientEmail}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
              <span className="text-bone">
                {booking.city}
                <br />
                <span className="text-muted">{booking.district}</span>
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CalendarDays aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
              <span className="text-bone">
                {booking.dates.map((d) => formatDate(d, "short")).join(", ")}
              </span>
            </li>
          </ul>
          <p className="mt-5 border-t border-white/8 pt-4 text-[11.5px] leading-relaxed text-muted/75">
            This page reads live data from the studio database using your private access link.
          </p>
          {pushSupported() && (
            <Button
              variant="secondary"
              size="sm"
              full
              icon={BellRing}
              className="mt-4"
              onClick={async () => {
                try {
                  await subscribeToBookingUpdates(booking.bookingNumber, token);
                  push({
                    tone: "success",
                    title: "Notifications enabled",
                    description: "We will alert this device when the status changes.",
                  });
                } catch (err) {
                  push({ tone: "error", title: "Could not enable notifications", description: (err as Error).message });
                }
              }}
            >
              Notify me about updates
            </Button>
          )}
          <Link
            href="/booking"
            className="mt-4 flex h-11 items-center justify-center rounded-full border border-white/12 text-[13px] text-bone transition-colors hover:border-accent/40 hover:text-accent-soft"
          >
            Start another request
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/6 pb-2.5">
      <dt className="text-[12.5px] text-muted">{label}</dt>
      <dd className="text-right text-[12.5px] text-bone">{value}</dd>
    </div>
  );
}
