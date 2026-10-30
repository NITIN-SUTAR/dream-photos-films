"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ImageUp,
  Search,
  TrendingDown,
  TrendingUp,
  UploadCloud,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiFailure } from "@/lib/api";
import { IconButton, LoadingSkeleton } from "@/components/ui/primitives";

export function PageIntro({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h2 className="display text-[26px] text-bone">{title}</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  index = 0,
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  icon?: LucideIcon;
  index?: number;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-[14px] panel p-4 transition-colors duration-300 hover:border-white/18"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-accent/[0.07] blur-2xl transition-opacity duration-500 group-hover:opacity-100"
      />
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted">{label}</p>
        {Icon && <Icon aria-hidden className="h-4 w-4 text-muted/70" />}
      </div>
      <p className="display mt-3 text-[30px] text-bone">{value}</p>
      <div className="mt-2 flex items-center gap-2">
        {typeof delta === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-1 font-mono text-[10.5px]",
              up ? "text-emerald-300" : "text-rose-300",
            )}
          >
            {up ? (
              <TrendingUp aria-hidden className="h-3 w-3" />
            ) : (
              <TrendingDown aria-hidden className="h-3 w-3" />
            )}
            {up ? "+" : ""}
            {delta}%
          </span>
        )}
        {hint && <span className="truncate text-[11.5px] text-muted">{hint}</span>}
      </div>
    </motion.article>
  );
}

export function Toolbar({
  search,
  onSearch,
  placeholder = "Search…",
  children,
}: {
  search: string;
  onSearch: (v: string) => void;
  placeholder?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <label className="relative min-w-[200px] flex-1">
        <span className="sr-only">{placeholder}</span>
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-[10px] border border-white/10 bg-white/[0.03] pl-9 pr-3 text-[13px] text-bone placeholder:text-white/25 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </label>
      {children}
    </div>
  );
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            "rounded-full border px-3 py-1.5 text-[12px] transition-all duration-250",
            value === o.value
              ? "border-accent/50 bg-accent/12 text-accent-soft"
              : "border-white/10 text-muted hover:border-white/25 hover:text-bone",
          )}
        >
          {o.label}
          {typeof o.count === "number" && (
            <span className="ml-1.5 font-mono text-[9.5px] opacity-70">{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  loading = false,
  empty,
  onRowClick,
}: {
  rows: T[];
  columns: Column<T>[];
  loading?: boolean;
  empty: ReactNode;
  onRowClick?: (row: T) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <LoadingSkeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }
  if (!rows.length) return <>{empty}</>;

  return (
    <div className="overflow-x-auto rounded-[14px] border border-white/8">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-white/8 bg-white/[0.02]">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  "whitespace-nowrap px-4 py-3 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted",
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <motion.tr
              key={row.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.25) }}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "border-b border-white/6 transition-colors duration-200 last:border-0",
                onRowClick && "cursor-pointer hover:bg-white/[0.035]",
              )}
            >
              {columns.map((c) => (
                <td key={c.key} className={cn("px-4 py-3.5 align-middle text-[13px]", c.className)}>
                  {c.render(row)}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReorderControls({
  onUp,
  onDown,
  disabledUp,
  disabledDown,
}: {
  onUp: () => void;
  onDown: () => void;
  disabledUp?: boolean;
  disabledDown?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <IconButton
        label="Move up"
        icon={ArrowUp}
        size="sm"
        variant="ghost"
        onClick={onUp}
        disabled={disabledUp}
      />
      <IconButton
        label="Move down"
        icon={ArrowDown}
        size="sm"
        variant="ghost"
        onClick={onDown}
        disabled={disabledDown}
      />
    </span>
  );
}

export function ActiveDot({ active }: { active: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
      <span
        aria-hidden
        className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-emerald-300" : "bg-white/25")}
      />
      <span className={active ? "text-emerald-200" : "text-muted"}>
        {active ? "Active" : "Hidden"}
      </span>
    </span>
  );
}

type UploadState = "IDLE" | "DRAGGING" | "UPLOADING" | "PROCESSING" | "READY" | "FAILED";

export interface UploadedAsset {
  assetId: string;
  url: string;
  storagePath: string;
  bucket: string;
  width: number | null;
  height: number | null;
  status: string;
}

/**
 * Real upload: the file is validated (MIME + magic bytes + size), stored and
 * only reported READY once the server has verified it on disk.
 */
export function UploadPanel({
  scope,
  kind = "IMAGE",
  label = "Drop a file here",
  hint = "JPG, PNG or WebP · up to 25MB",
  onReady,
}: {
  scope: "portfolio" | "films" | "gallery" | "testimonials";
  kind?: "IMAGE" | "VIDEO";
  label?: string;
  hint?: string;
  onReady: (asset: UploadedAsset) => void;
}) {
  const [state, setState] = useState<UploadState>("IDLE");
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");

  async function upload(file: File) {
    setFileName(file.name);
    setState("UPLOADING");
    setMessage("");
    const form = new FormData();
    form.append("file", file);
    form.append("scope", scope);
    form.append("kind", kind);
    try {
      setState("PROCESSING");
      const asset = await api.postForm<UploadedAsset>("/api/admin/media", form);
      setState("READY");
      onReady(asset);
    } catch (err) {
      setState("FAILED");
      setMessage((err as ApiFailure).message);
    }
  }

  const busy = state === "UPLOADING" || state === "PROCESSING";

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setState("DRAGGING");
      }}
      onDragLeave={() => setState((s2) => (s2 === "DRAGGING" ? "IDLE" : s2))}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) void upload(f);
      }}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-[14px] border border-dashed p-7 text-center transition-all duration-300",
        state === "DRAGGING"
          ? "border-accent/60 bg-accent/[0.07]"
          : state === "FAILED"
            ? "border-rose-400/40 bg-rose-500/[0.06]"
            : state === "READY"
              ? "border-emerald-400/40 bg-emerald-500/[0.05]"
              : "border-white/12 bg-white/[0.02]",
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full border",
          state === "READY"
            ? "border-emerald-400/40 text-emerald-300"
            : state === "FAILED"
              ? "border-rose-400/40 text-rose-300"
              : "border-white/12 text-muted",
        )}
      >
        {state === "READY" ? (
          <CheckCircle2 aria-hidden className="h-5 w-5" />
        ) : state === "FAILED" ? (
          <XCircle aria-hidden className="h-5 w-5" />
        ) : busy ? (
          <UploadCloud aria-hidden className="h-5 w-5 animate-pulse" />
        ) : (
          <ImageUp aria-hidden className="h-5 w-5" />
        )}
      </span>

      <p className="mt-3 text-[13.5px] text-bone" aria-live="polite">
        {state === "IDLE" && label}
        {state === "DRAGGING" && "Release to upload"}
        {state === "UPLOADING" && `Uploading ${fileName}…`}
        {state === "PROCESSING" && "Validating and storing…"}
        {state === "READY" && `${fileName} stored and ready`}
        {state === "FAILED" && `Upload failed — ${fileName}`}
      </p>
      <p className="mt-1 text-[11.5px] text-muted">{message || hint}</p>

      {busy && (
        <div className="mt-4 h-1 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={{ width: "12%" }}
            animate={{ width: state === "PROCESSING" ? "92%" : "55%" }}
            transition={{ duration: 0.6 }}
          />
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <label className="cursor-pointer rounded-full border border-white/12 px-4 py-2 text-[12px] text-bone transition-colors hover:border-accent/40 hover:text-accent-soft">
          Choose file
          <input
            type="file"
            accept={kind === "IMAGE" ? "image/jpeg,image/png,image/webp" : "video/mp4,video/webm"}
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
            }}
          />
        </label>
        {(state === "READY" || state === "FAILED") && (
          <button
            type="button"
            onClick={() => setState("IDLE")}
            className="rounded-full border border-white/12 px-4 py-2 text-[12px] text-muted transition-colors hover:text-bone"
          >
            Upload another
          </button>
        )}
      </div>
    </div>
  );
}

export function BarChart({
  data,
  labelA,
  labelB,
}: {
  data: { month: string; requests: number; confirmed: number }[];
  labelA: string;
  labelB: string;
}) {
  const max = Math.max(...data.map((d) => d.requests)) || 1;
  return (
    <figure>
      <figcaption className="mb-4 flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">
          <span aria-hidden className="h-2 w-2 rounded-[2px] bg-white/25" /> {labelA}
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">
          <span aria-hidden className="h-2 w-2 rounded-[2px] bg-accent" /> {labelB}
        </span>
      </figcaption>
      <div className="flex h-44 items-end gap-3">
        {data.map((d, i) => (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-2">
            <div className="relative flex h-full w-full items-end justify-center gap-1">
              <motion.span
                initial={{ height: 0 }}
                animate={{ height: `${(d.requests / max) * 100}%` }}
                transition={{ duration: 0.7, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="w-1/2 rounded-t-[4px] bg-white/18"
                title={`${d.requests} ${labelA}`}
              />
              <motion.span
                initial={{ height: 0 }}
                animate={{ height: `${(d.confirmed / max) * 100}%` }}
                transition={{ duration: 0.7, delay: 0.08 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="w-1/2 rounded-t-[4px] bg-accent/80"
                title={`${d.confirmed} ${labelB}`}
              />
            </div>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted">
              {d.month}
            </span>
          </div>
        ))}
      </div>
    </figure>
  );
}

export function SplitBar({ data }: { data: { label: string; value: number }[] }) {
  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        {data.map((d, i) => (
          <motion.span
            key={d.label}
            initial={{ width: 0 }}
            animate={{ width: `${d.value}%` }}
            transition={{ duration: 0.8, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "h-full",
              ["bg-accent", "bg-accent/70", "bg-accent/45", "bg-white/30", "bg-white/18"][i % 5],
            )}
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center justify-between text-[12.5px]">
            <span className="inline-flex items-center gap-2 text-muted">
              <span
                aria-hidden
                className={cn(
                  "h-2 w-2 rounded-[2px]",
                  ["bg-accent", "bg-accent/70", "bg-accent/45", "bg-white/30", "bg-white/18"][i % 5],
                )}
              />
              {d.label}
            </span>
            <span className="font-mono text-[11px] text-bone">{d.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
