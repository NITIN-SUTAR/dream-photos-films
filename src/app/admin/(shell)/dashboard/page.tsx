"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  Clock3,
  IndianRupee,
  Users,
} from "lucide-react";
import { useApi } from "@/lib/api";
import { formatDate, formatINR, relativeTime } from "@/lib/utils";
import { BarChart, PageIntro, SplitBar, StatCard } from "@/components/admin/parts";
import { ErrorState, LoadingSkeleton, StatusIndicator } from "@/components/ui/primitives";
import type { AdminBookingRow, BookingView } from "@/lib/api";

interface DashboardPayload {
  stats: {
    pending: number;
    confirmed: number;
    upcomingDays: number;
    pipeline: string | number;
    confirmedRevenue: string | number;
    clients: number;
    trend: { month: string; requests: number; confirmed: number }[];
    serviceMix: { label: string; value: number }[];
  };
  upcoming: {
    bookingNumber: string;
    clientName: string;
    serviceName: string;
    firstDate: string;
    days: number;
    estimate: number;
    status: BookingView["status"];
  }[];
  pending: AdminBookingRow[];
  activity: { id: string; label: string; meta: string; at: string }[];
}

export default function DashboardPage() {
  const { data, loading, error, refetch } = useApi<DashboardPayload>("/api/admin/dashboard");

  if (error) {
    return <ErrorState title="Dashboard unavailable" description={error.message} onRetry={refetch} />;
  }

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-16 w-full max-w-md" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <LoadingSkeleton className="h-64 w-full" />
      </div>
    );
  }

  const s = data.stats;
  const kpis = [
    { label: "Pending requests", value: String(s.pending), hint: "Awaiting your review", icon: Clock3 },
    { label: "Confirmed bookings", value: String(s.confirmed), hint: "Committed coverage", icon: CalendarDays },
    { label: "Upcoming event days", value: String(s.upcomingDays), hint: "Held in the calendar", icon: CalendarClock },
    {
      label: "Estimated pipeline",
      value: formatINR(Number(s.pipeline)),
      hint: `Confirmed ${formatINR(Number(s.confirmedRevenue))}`,
      icon: IndianRupee,
    },
  ];

  return (
    <div>
      <PageIntro
        title="Studio overview"
        description="Live figures read straight from the studio database."
        actions={
          <Link
            href="/admin/bookings"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-white/12 px-4 text-[12.5px] text-bone transition-colors hover:border-accent/40 hover:text-accent-soft"
          >
            Review bookings
            <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <section aria-label="Key figures" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <StatCard key={k.label} index={i} label={k.label} value={k.value} hint={k.hint} icon={k.icon} />
        ))}
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <section className="rounded-[14px] panel p-5" aria-labelledby="trend-title">
          <div className="mb-5">
            <h3 id="trend-title" className="text-[14px] text-bone">Booking activity</h3>
            <p className="mt-1 text-[12px] text-muted">
              Requests received versus bookings confirmed, last six months.
            </p>
          </div>
          <BarChart data={s.trend} labelA="Requests" labelB="Confirmed" />
        </section>

        <section className="rounded-[14px] panel p-5" aria-labelledby="mix-title">
          <h3 id="mix-title" className="text-[14px] text-bone">Service mix</h3>
          <p className="mb-5 mt-1 text-[12px] text-muted">Share of bookings by service.</p>
          {s.serviceMix.length ? (
            <SplitBar data={s.serviceMix.map((m) => ({ label: m.label, value: Number(m.value) }))} />
          ) : (
            <p className="text-[12.5px] text-muted">No bookings recorded yet.</p>
          )}
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-4">
          <section className="rounded-[14px] panel p-5" aria-labelledby="upcoming-title">
            <div className="mb-4 flex items-center justify-between">
              <h3 id="upcoming-title" className="text-[14px] text-bone">Upcoming events</h3>
              <Link href="/admin/calendar" className="text-[12px] text-accent hover:text-accent-soft">
                Open calendar
              </Link>
            </div>
            {data.upcoming.length === 0 ? (
              <p className="text-[12.5px] text-muted">No confirmed events scheduled.</p>
            ) : (
              <ul className="divide-y divide-white/6">
                {data.upcoming.map((b) => (
                  <li key={b.bookingNumber}>
                    <Link
                      href="/admin/bookings"
                      className="group flex flex-wrap items-center gap-3 py-3 transition-colors hover:bg-white/[0.02]"
                    >
                      <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[10px] border border-accent/25 bg-accent/[0.07]">
                        <span className="font-mono text-[13px] leading-none text-accent">
                          {b.firstDate.slice(8)}
                        </span>
                        <span className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-muted">
                          {formatDate(b.firstDate, "short").split(" ")[1]}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] text-bone">
                          {b.clientName} · {b.serviceName}
                        </span>
                        <span className="block truncate font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                          {b.bookingNumber} · {b.days} day{b.days > 1 ? "s" : ""} ·{" "}
                          {relativeTime(b.firstDate)}
                        </span>
                      </span>
                      <span className="font-mono text-[12px] text-bone">{formatINR(b.estimate)}</span>
                      <StatusIndicator status={b.status} size="sm" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-[14px] panel p-5" aria-labelledby="pending-title">
            <h3 id="pending-title" className="text-[14px] text-bone">Pending requests</h3>
            <p className="mb-4 mt-1 text-[12px] text-muted">Waiting on a decision from the studio.</p>
            {data.pending.length === 0 ? (
              <p className="text-[12.5px] text-muted">Nothing is waiting for review.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {data.pending.map((b) => (
                  <li key={b.bookingNumber} className="rounded-[12px] border border-amber-300/20 bg-amber-400/[0.05] p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-amber-200">{b.bookingNumber}</span>
                      <StatusIndicator status={b.status} size="sm" />
                    </div>
                    <p className="mt-2 text-[13.5px] text-bone">{b.clientName}</p>
                    <p className="text-[12px] text-muted">
                      {b.serviceName} · {b.dates.length} day{b.dates.length > 1 ? "s" : ""}
                    </p>
                    <p className="mt-2 font-mono text-[12px] text-bone">{formatINR(b.estimate)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="rounded-[14px] panel p-5" aria-labelledby="activity-title">
          <h3 id="activity-title" className="mb-4 flex items-center gap-2 text-[14px] text-bone">
            <Users aria-hidden className="h-3.5 w-3.5 text-accent" /> Recent activity
          </h3>
          {data.activity.length === 0 ? (
            <p className="text-[12.5px] text-muted">No recorded activity yet.</p>
          ) : (
            <ol className="space-y-0">
              {data.activity.map((a, i) => (
                <li key={a.id} className="relative flex gap-3 pb-5 last:pb-0">
                  {i !== data.activity.length - 1 && (
                    <span aria-hidden className="absolute left-[5px] top-3 h-full w-px bg-white/8" />
                  )}
                  <span aria-hidden className="relative mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-accent/50 bg-ink" />
                  <div className="min-w-0">
                    <p className="text-[12.5px] leading-snug text-bone/90 first-letter:uppercase">{a.label}</p>
                    <p className="mt-0.5 truncate font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted">
                      {a.meta} · {relativeTime(a.at)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
