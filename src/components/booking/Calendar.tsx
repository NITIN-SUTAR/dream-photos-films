"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import type { DayState } from "@/lib/api";
import { buildMonthMatrix, cn, datesBetween, monthLabel, parseISO, WEEKDAYS } from "@/lib/utils";

export type CalendarMode = "single" | "multi" | "range";

export interface CalendarProps {
  mode: CalendarMode;
  selected: string[];
  onSelect: (dates: string[]) => void;
  /** authoritative availability from the server, keyed by ISO date */
  availability: Record<string, DayState>;
  /** business "today" supplied by the server */
  today: string;
  minDate?: string;
  maxSelectable?: number;
  onMonthChange?: (from: string, to: string) => void;
  onDayInspect?: (iso: string) => void;
  compact?: boolean;
  loading?: boolean;
  className?: string;
}

const STATE_LABEL: Record<DayState, string> = {
  available: "Available",
  pending: "On hold",
  confirmed: "Booked",
  blocked: "Unavailable",
};

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function shift(date: string, days: number) {
  const d = parseISO(date);
  d.setDate(d.getDate() + days);
  return iso(d.getFullYear(), d.getMonth(), d.getDate());
}

export function Calendar({
  mode,
  selected,
  onSelect,
  availability,
  today,
  minDate,
  maxSelectable = 5,
  onMonthChange,
  onDayInspect,
  compact = false,
  loading = false,
  className,
}: CalendarProps) {
  const start = parseISO(selected[0] ?? today);
  const [cursor, setCursor] = useState({ year: start.getFullYear(), month: start.getMonth() });
  const [focusDate, setFocusDate] = useState<string>(selected[0] ?? today);
  const [dir, setDir] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);
  const shouldFocus = useRef(false);
  const floor = minDate ?? today;

  const matrix = useMemo(
    () => buildMonthMatrix(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  );

  useEffect(() => {
    if (!onMonthChange) return;
    const from = iso(cursor.year, cursor.month, 1);
    const last = new Date(cursor.year, cursor.month + 1, 0).getDate();
    onMonthChange(from, iso(cursor.year, cursor.month, last));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor.year, cursor.month]);

  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-date="${focusDate}"]`)
      ?.focus({ preventScroll: false });
  }, [focusDate, cursor]);

  const resolve = (date: string): DayState => availability[date] ?? "available";

  function move(delta: number) {
    const next = shift(focusDate, delta);
    const d = parseISO(next);
    shouldFocus.current = true;
    setFocusDate(next);
    if (d.getMonth() !== cursor.month || d.getFullYear() !== cursor.year) {
      setDir(delta > 0 ? 1 : -1);
      setCursor({ year: d.getFullYear(), month: d.getMonth() });
    }
  }

  function shiftMonth(delta: number) {
    setDir(delta);
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function isDisabled(date: string) {
    return date < floor || resolve(date) !== "available";
  }

  function toggle(date: string) {
    if (onDayInspect) {
      onDayInspect(date);
      return;
    }
    if (isDisabled(date)) return;
    if (mode === "single") return onSelect([date]);
    if (mode === "multi") {
      const next = selected.includes(date)
        ? selected.filter((d) => d !== date)
        : [...selected, date].sort();
      if (next.length > maxSelectable) return;
      return onSelect(next);
    }
    if (selected.length !== 1) return onSelect([date]);
    const span = datesBetween(selected[0], date);
    if (span.length > maxSelectable || span.some(isDisabled)) return onSelect([date]);
    onSelect(span);
  }

  const selectedSet = new Set(selected);
  const first = selected[0];
  const last = selected[selected.length - 1];

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
          className="glass inline-flex h-9 w-9 items-center justify-center rounded-full text-bone transition-colors hover:bg-white/10"
        >
          <ChevronLeft aria-hidden className="h-4 w-4" />
        </button>
        <div className="overflow-hidden text-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={`${cursor.year}-${cursor.month}`}
              initial={{ opacity: 0, y: dir * 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: dir * -10 }}
              transition={{ duration: 0.22 }}
              className="display text-[20px] text-bone"
            >
              {monthLabel(cursor.year, cursor.month)}
            </motion.p>
          </AnimatePresence>
          {loading && (
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
              Checking availability…
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
          className="glass inline-flex h-9 w-9 items-center justify-center rounded-full text-bone transition-colors hover:bg-white/10"
        >
          <ChevronRight aria-hidden className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={gridRef}
        role="grid"
        aria-busy={loading}
        aria-label={`${monthLabel(cursor.year, cursor.month)} availability`}
        onKeyDown={(e) => {
          const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"];
          if (!keys.includes(e.key)) return;
          e.preventDefault();
          if (e.key === "ArrowLeft") move(-1);
          if (e.key === "ArrowRight") move(1);
          if (e.key === "ArrowUp") move(-7);
          if (e.key === "ArrowDown") move(7);
          if (e.key === "PageUp") shiftMonth(-1);
          if (e.key === "PageDown") shiftMonth(1);
          if (e.key === "Home") move(-parseISO(focusDate).getDay());
          if (e.key === "End") move(6 - parseISO(focusDate).getDay());
        }}
      >
        <div role="row" className="mb-2 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              role="columnheader"
              aria-label={d}
              className="py-1 text-center font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted/70"
            >
              {d.slice(0, compact ? 1 : 2)}
            </div>
          ))}
        </div>

        <div className="grid gap-1">
          {matrix.map((row, ri) => (
            <div key={ri} role="row" className="grid grid-cols-7 gap-1">
              {row.map((date, ci) => {
                if (!date)
                  return <div key={`${ri}-${ci}`} role="gridcell" aria-hidden className="aspect-square" />;
                const state = resolve(date);
                const past = date < floor;
                const disabled = isDisabled(date);
                const isSelected = selectedSet.has(date);
                const isEdge = date === first || date === last;
                const inRange = isSelected && !isEdge;
                const isToday = date === today;

                return (
                  <div key={date} role="gridcell" aria-selected={isSelected} className="relative">
                    <button
                      type="button"
                      data-date={date}
                      tabIndex={date === focusDate ? 0 : -1}
                      disabled={disabled && !onDayInspect}
                      aria-disabled={disabled}
                      aria-label={`${parseISO(date).getDate()} ${monthLabel(
                        cursor.year,
                        cursor.month,
                      )} — ${past ? "Past date" : STATE_LABEL[state]}`}
                      onFocus={() => setFocusDate(date)}
                      onClick={() => toggle(date)}
                      className={cn(
                        "relative flex aspect-square w-full items-center justify-center rounded-[10px] border text-[13px] transition-all duration-250 disabled:cursor-not-allowed",
                        isSelected && isEdge
                          ? "border-accent bg-accent font-medium text-ink shadow-[0_10px_26px_-12px_rgba(201,162,39,.9)]"
                          : inRange
                            ? "border-accent/30 bg-accent/18 text-bone"
                            : disabled
                              ? "border-transparent bg-white/[0.02] text-muted/40"
                              : "border-white/8 bg-white/[0.025] text-bone hover:-translate-y-0.5 hover:border-accent/40 hover:bg-white/[0.06]",
                      )}
                    >
                      <span className={cn(past && "line-through decoration-white/25")}>
                        {parseISO(date).getDate()}
                      </span>
                      {(state === "confirmed" || state === "blocked") && !past && (
                        <Lock aria-hidden className="absolute bottom-1 right-1 h-2.5 w-2.5 text-muted/70" />
                      )}
                      {state === "pending" && !past && (
                        <span aria-hidden className="absolute bottom-1.5 h-1 w-1 rounded-full bg-amber-300" />
                      )}
                      {state === "available" && !past && !isSelected && (
                        <span aria-hidden className="absolute bottom-1.5 h-1 w-1 rounded-full bg-accent/45" />
                      )}
                      {isToday && (
                        <span
                          aria-hidden
                          className={cn("absolute inset-x-3 top-1 h-px", isSelected ? "bg-ink/40" : "bg-accent/70")}
                        />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {[
          { label: "Available", cls: "bg-accent/45" },
          { label: "Selected", cls: "bg-accent" },
          { label: "On hold", cls: "bg-amber-300" },
          { label: "Booked / Blocked", cls: "bg-white/25" },
        ].map((l) => (
          <li key={l.label} className="flex items-center gap-1.5">
            <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", l.cls)} />
            <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">{l.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Loads authoritative availability for a visible month range. */
export function useAvailability() {
  const [availability, setAvailability] = useState<Record<string, DayState>>({});
  const [loading, setLoading] = useState(false);
  const loaded = useRef(new Set<string>());

  const load = async (from: string, to: string) => {
    const key = `${from}:${to}`;
    if (loaded.current.has(key)) return;
    loaded.current.add(key);
    setLoading(true);
    try {
      const res = await fetch(`/api/public/availability?from=${from}&to=${to}`, {
        credentials: "same-origin",
      });
      const body = await res.json();
      if (body?.ok) {
        setAvailability((cur) => {
          const next = { ...cur };
          for (const d of body.data.days as { date: string; state: DayState }[]) {
            next[d.date] = d.state;
          }
          return next;
        });
      }
    } catch {
      loaded.current.delete(key);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    loaded.current.clear();
    setAvailability({});
  };

  return { availability, loading, load, reset };
}
