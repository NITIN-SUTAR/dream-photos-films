import type { BookingStatus } from "./types";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(value: number): string {
  return inr.format(value);
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(iso: string, style: "long" | "short" = "long"): string {
  if (!iso) return "—";
  const d = parseISO(iso);
  const month = style === "long" ? MONTHS[d.getMonth()] : MONTHS_SHORT[d.getMonth()];
  return `${d.getDate()} ${month} ${d.getFullYear()}`;
}

export function formatDateRange(dates: string[]): string {
  if (!dates.length) return "—";
  const sorted = [...dates].sort();
  if (sorted.length === 1) return formatDate(sorted[0], "short");
  return `${formatDate(sorted[0], "short")} → ${formatDate(
    sorted[sorted.length - 1],
    "short",
  )} · ${sorted.length} days`;
}

export function relativeTime(iso: string): string {
  const now = new Date();
  const then = parseISO(iso);
  const diff = Math.round(
    (then.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      86400000,
  );
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  return `in ${diff} days`;
}

export const STATUS_STYLES: Record<
  BookingStatus,
  { label: string; dot: string; chip: string; text: string }
> = {
  PENDING: {
    label: "Pending",
    dot: "bg-amber-300",
    chip: "bg-amber-400/10 border-amber-300/30 text-amber-200",
    text: "text-amber-200",
  },
  CONFIRMED: {
    label: "Confirmed",
    dot: "bg-emerald-300",
    chip: "bg-emerald-400/10 border-emerald-300/30 text-emerald-200",
    text: "text-emerald-200",
  },
  REJECTED: {
    label: "Rejected",
    dot: "bg-rose-300",
    chip: "bg-rose-400/10 border-rose-300/30 text-rose-200",
    text: "text-rose-200",
  },
  CANCELLED: {
    label: "Cancelled",
    dot: "bg-slate-300",
    chip: "bg-slate-300/10 border-slate-300/25 text-slate-200",
    text: "text-slate-200",
  },
  EXPIRED: {
    label: "Expired",
    dot: "bg-zinc-400",
    chip: "bg-zinc-400/10 border-zinc-400/25 text-zinc-300",
    text: "text-zinc-300",
  },
};

export function buildMonthMatrix(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(
      `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    );
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export function monthLabel(year: number, month: number): string {
  return `${MONTHS[month]} ${year}`;
}

export function datesBetween(a: string, b: string): string[] {
  const [start, end] = a <= b ? [a, b] : [b, a];
  const out: string[] = [];
  const cur = parseISO(start);
  const last = parseISO(end);
  while (cur <= last) {
    out.push(
      `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(
        cur.getDate(),
      ).padStart(2, "0")}`,
    );
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}
