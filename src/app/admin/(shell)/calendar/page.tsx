"use client";

import { useMemo, useState } from "react";
import { CalendarOff, CheckCircle2, Lock, Unlock } from "lucide-react";
import { api, ApiFailure, useApi, type DayState } from "@/lib/api";
import { formatDate, formatINR, monthLabel, parseISO } from "@/lib/utils";
import { Calendar } from "@/components/booking/Calendar";
import { PageIntro } from "@/components/admin/parts";
import { Button, EmptyState, ErrorState, LoadingSkeleton, StatusIndicator } from "@/components/ui/primitives";
import { ConfirmDialog, useToast } from "@/components/ui/overlays";
import type { BookingView } from "@/lib/api";

interface CalendarPayload {
  days: { date: string; state: DayState; label: string | null }[];
  bookings: {
    date: string;
    bookingNumber: string;
    clientName: string;
    serviceName: string;
    status: BookingView["status"];
    estimate: number;
  }[];
  blocked: { date: string; reason: string }[];
}

function monthBounds(base: Date) {
  const y = base.getFullYear();
  const m = base.getMonth();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    from: `${y}-${pad(m + 1)}-01`,
    to: `${y}-${pad(m + 1)}-${pad(new Date(y, m + 1, 0).getDate())}`,
  };
}

export default function AdminCalendarPage() {
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`;
  const [range, setRange] = useState(monthBounds(today));
  const [selected, setSelected] = useState(todayIso);
  const [confirm, setConfirm] = useState<null | "block" | "release">(null);
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const { data, loading, error, refetch } = useApi<CalendarPayload>(
    `/api/admin/calendar?from=${range.from}&to=${range.to}`,
    [range.from, range.to],
  );

  const availability = useMemo(() => {
    const map: Record<string, DayState> = {};
    for (const d of data?.days ?? []) map[d.date] = d.state;
    return map;
  }, [data]);

  const state = availability[selected] ?? "available";
  const booking = data?.bookings.find((b) => b.date === selected) ?? null;
  const blocked = data?.blocked.find((b) => b.date === selected) ?? null;

  async function apply(action: "block" | "unblock") {
    setBusy(true);
    try {
      await api.post(`/api/admin/calendar/${action}`, {
        date: selected,
        reason: action === "block" ? "Studio unavailable" : undefined,
      });
      await refetch();
      push({
        tone: "success",
        title: action === "block" ? "Date blocked" : "Date released",
        description: formatDate(selected),
      });
    } catch (err) {
      push({ tone: "error", title: "Could not update the calendar", description: (err as ApiFailure).message });
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  return (
    <div>
      <PageIntro
        title="Availability calendar"
        description="Confirmed coverage, pending holds and blocked dates — read live from the booking engine."
      />

      {error ? (
        <ErrorState title="Calendar unavailable" description={error.message} onRetry={refetch} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[14px] panel p-5" aria-label="Month calendar">
            <Calendar
              mode="single"
              selected={[selected]}
              onSelect={() => {}}
              availability={availability}
              today={todayIso}
              minDate="1900-01-01"
              loading={loading}
              onDayInspect={setSelected}
              onMonthChange={(from, to) => setRange({ from, to })}
            />
            <p className="mt-3 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted">
              {monthLabel(parseISO(range.from).getFullYear(), parseISO(range.from).getMonth())}
            </p>
          </section>

          <div className="space-y-4">
            <section className="rounded-[14px] panel p-5" aria-labelledby="day-title">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">Selected date</p>
                  <h3 id="day-title" className="display mt-1.5 text-[24px] text-bone">
                    {formatDate(selected)}
                  </h3>
                </div>
                <span className="rounded-full border border-white/12 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                  {state}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {state === "blocked" ? (
                  <Button variant="secondary" size="sm" icon={Unlock} loading={busy} onClick={() => setConfirm("release")}>
                    Unblock date
                  </Button>
                ) : state === "available" ? (
                  <Button variant="secondary" size="sm" icon={Lock} loading={busy} onClick={() => setConfirm("block")}>
                    Block date
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" icon={CalendarOff} disabled>
                    Held by a booking
                  </Button>
                )}
              </div>

              <div className="mt-5 border-t border-white/8 pt-4">
                {loading ? (
                  <LoadingSkeleton className="h-24 w-full" />
                ) : booking ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-[11px] text-accent">{booking.bookingNumber}</p>
                      <StatusIndicator status={booking.status} size="sm" />
                    </div>
                    <p className="mt-2 text-[14px] text-bone">{booking.clientName}</p>
                    <p className="text-[12.5px] text-muted">{booking.serviceName}</p>
                    <p className="mt-3 font-mono text-[12.5px] text-bone">{formatINR(booking.estimate)}</p>
                  </div>
                ) : blocked ? (
                  <p className="text-[13px] text-muted">
                    Blocked{blocked.reason ? ` — ${blocked.reason}` : ""}. Hidden from the public
                    booking calendar.
                  </p>
                ) : (
                  <EmptyState
                    icon={CheckCircle2}
                    title="Date is open"
                    description="No coverage scheduled. Clients can request this date from the public booking flow."
                  />
                )}
              </div>
            </section>

            <section className="rounded-[14px] panel p-5" aria-labelledby="legend-title">
              <h3 id="legend-title" className="text-[14px] text-bone">State reference</h3>
              <ul className="mt-3 space-y-2.5 text-[12.5px]">
                {[
                  { c: "bg-accent/45", t: "Available — open for requests" },
                  { c: "bg-amber-300", t: "Pending — 24-hour hold awaiting your decision" },
                  { c: "bg-emerald-300", t: "Confirmed — crew committed" },
                  { c: "bg-white/30", t: "Blocked — manually held by the studio" },
                  { c: "bg-white/15", t: "Released / cancelled — back in the pool" },
                ].map((l) => (
                  <li key={l.t} className="flex items-center gap-2.5 text-muted">
                    <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${l.c}`} />
                    {l.t}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={() => apply(confirm === "block" ? "block" : "unblock")}
        loading={busy}
        title={confirm === "block" ? "Block this date?" : "Release this date?"}
        message={
          confirm === "block"
            ? `${formatDate(selected)} will be hidden from the public booking calendar.`
            : `${formatDate(selected)} will become available for new requests again.`
        }
        confirmLabel={confirm === "block" ? "Block date" : "Release date"}
        tone={confirm === "block" ? "danger" : "default"}
      />
    </div>
  );
}
