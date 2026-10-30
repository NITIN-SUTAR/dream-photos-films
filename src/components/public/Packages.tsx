"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import type { ExtraDTO, PackageDTO } from "@/lib/api";
import { cn, formatINR } from "@/lib/utils";
import { Reveal, SectionHeader } from "@/components/ui/primitives";

export function Packages({
  packages,
  extras: catalogExtras,
  weddingServiceId,
}: {
  packages: PackageDTO[];
  extras: ExtraDTO[];
  weddingServiceId: string | null;
}) {
  const weddingPackages = useMemo(
    () => packages.filter((p) => !weddingServiceId || p.serviceId === weddingServiceId),
    [packages, weddingServiceId],
  );
  const [selected, setSelected] = useState(
    weddingPackages[1]?.id ?? weddingPackages[0]?.id ?? "",
  );
  const [album, setAlbum] = useState(true);
  const [extras, setExtras] = useState<string[]>([]);

  const priceOf = (p: PackageDTO, withAlbum: boolean) =>
    p.options.find((o) => o.kind === (withAlbum ? "WITH_ALBUM" : "WITHOUT_ALBUM"))?.price ?? 0;

  const pkg = weddingPackages.find((p) => p.id === selected) ?? weddingPackages[0];
  const base = pkg ? priceOf(pkg, album) : 0;
  const availableExtras = useMemo(
    () =>
      catalogExtras.filter((e) => !weddingServiceId || e.serviceIds.includes(weddingServiceId)),
    [catalogExtras, weddingServiceId],
  );
  const extrasTotal = availableExtras
    .filter((e) => extras.includes(e.id))
    .reduce((sum, e) => sum + e.price, 0);

  const bookingHref = pkg
    ? `/booking?service=${pkg.serviceId}&package=${pkg.id}&album=${album ? "1" : "0"}${
        extras.length ? `&extras=${extras.join(",")}` : ""
      }`
    : "/booking";

  if (!pkg) return null;

  return (
    <section
      id="packages"
      aria-labelledby="packages-title"
      className="relative overflow-hidden border-y border-white/6 bg-ink-2/50 py-24 sm:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_85%_10%,rgba(201,162,39,.08),transparent_60%)]"
      />
      <div className="relative mx-auto w-full max-w-[1500px] px-5 sm:px-8">
        <Reveal>
          <SectionHeader
            index="06"
            eyebrow="Wedding Packages"
            title={<span id="packages-title">Configure your coverage</span>}
            description="Three studio packages, each with an album option. Adjust it here and carry the configuration straight into the booking flow."
          />
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
          {/* package selector */}
          <div className="grid gap-4 sm:grid-cols-3">
            {weddingPackages.map((p, i) => {
              const isActive = p.id === selected;
              const price = priceOf(p, album);
              return (
                <Reveal key={p.id} delay={i * 0.06} y={20}>
                  <button
                    type="button"
                    onClick={() => setSelected(p.id)}
                    aria-pressed={isActive}
                    className={cn(
                      "group relative flex h-full w-full flex-col rounded-[14px] border p-5 text-left transition-all duration-500",
                      isActive
                        ? "border-accent/45 bg-gradient-to-b from-accent/[0.09] to-transparent shadow-[0_28px_70px_-42px_rgba(201,162,39,.7)]"
                        : "border-white/8 bg-white/[0.02] hover:-translate-y-0.5 hover:border-white/20",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={cn(
                          "font-mono text-[10px] uppercase tracking-[0.2em]",
                          isActive ? "text-accent" : "text-muted",
                        )}
                      >
                        {p.code}
                      </span>
                      {p.highlight && (
                        <span className="rounded-full border border-white/12 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                          {p.highlight}
                        </span>
                      )}
                    </div>
                    <h3 className="display mt-3 text-[24px] text-bone">{p.name}</h3>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                      {p.description}
                    </p>
                    <ul className="mt-4 flex-1 space-y-2 border-t border-white/8 pt-4">
                      {p.inclusions.map((inc) => (
                        <li key={inc} className="flex items-start gap-2 text-[12.5px] text-bone/85">
                          <Check
                            aria-hidden
                            className={cn(
                              "mt-0.5 h-3.5 w-3.5 shrink-0",
                              isActive ? "text-accent" : "text-muted",
                            )}
                          />
                          {inc}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 flex items-end justify-between border-t border-white/8 pt-4">
                      <div>
                        <p className="display text-[26px] text-bone">{formatINR(price)}</p>
                        <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">
                          {album ? "with album" : "without album"}
                        </p>
                      </div>
                      <span
                        aria-hidden
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-300",
                          isActive
                            ? "border-accent bg-accent text-ink"
                            : "border-white/15 text-muted group-hover:border-white/35",
                        )}
                      >
                        {isActive ? (
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                      </span>
                    </div>
                  </button>
                </Reveal>
              );
            })}
          </div>

          {/* configurator panel */}
          <Reveal delay={0.1}>
            <aside className="glass sticky top-28 rounded-[16px] p-5 sm:p-6" aria-label="Package configuration">
              <p className="eyebrow">Your configuration</p>
              <h3 className="display mt-2 text-[24px] text-bone">
                {pkg.code} — {pkg.name}
              </h3>

              <div
                role="group"
                aria-label="Album option"
                className="mt-5 grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1"
              >
                {[
                  { label: "With album", value: true },
                  { label: "No album", value: false },
                ].map((o) => (
                  <button
                    key={o.label}
                    type="button"
                    onClick={() => setAlbum(o.value)}
                    aria-pressed={album === o.value}
                    className={cn(
                      "relative rounded-full py-2 text-[12.5px] transition-colors duration-300",
                      album === o.value ? "text-ink" : "text-muted hover:text-bone",
                    )}
                  >
                    {album === o.value && (
                      <motion.span
                        layoutId="album-toggle"
                        className="absolute inset-0 rounded-full bg-bone"
                        transition={{ type: "spring", stiffness: 420, damping: 36 }}
                      />
                    )}
                    <span className="relative z-10">{o.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-5">
                <p className="eyebrow">Extras</p>
                <ul className="mt-3 max-h-56 space-y-1.5 overflow-y-auto pr-1">
                  {availableExtras.map((e) => {
                    const on = extras.includes(e.id);
                    return (
                      <li key={e.id}>
                        <button
                          type="button"
                          onClick={() =>
                            setExtras((cur) =>
                              cur.includes(e.id)
                                ? cur.filter((x) => x !== e.id)
                                : [...cur, e.id],
                            )
                          }
                          aria-pressed={on}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-[10px] border px-3 py-2.5 text-left transition-all duration-300",
                            on
                              ? "border-accent/45 bg-accent/[0.08]"
                              : "border-white/8 bg-white/[0.02] hover:border-white/20",
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[12.5px] text-bone">
                              {e.name}
                            </span>
                            <span className="block truncate font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted">
                              {e.group}
                            </span>
                          </span>
                          <span
                            className={cn(
                              "shrink-0 font-mono text-[11px]",
                              on ? "text-accent" : "text-muted",
                            )}
                          >
                            +{formatINR(e.price)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <dl className="mt-5 space-y-2 border-t border-white/8 pt-4 text-[12.5px]">
                <div className="flex justify-between">
                  <dt className="text-muted">Package</dt>
                  <dd className="text-bone">{formatINR(base)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Extras ({extras.length})</dt>
                  <dd className="text-bone">{formatINR(extrasTotal)}</dd>
                </div>
                <div className="flex items-end justify-between border-t border-white/8 pt-3">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                    Estimate
                  </dt>
                  <dd className="display text-[30px] text-bone">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={base + extrasTotal}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="inline-block"
                      >
                        {formatINR(base + extrasTotal)}
                      </motion.span>
                    </AnimatePresence>
                  </dd>
                </div>
              </dl>
              <p className="mt-2 text-[11px] leading-relaxed text-muted/80">
                Indicative estimate only. Final quote is confirmed by the studio after we
                review dates, travel and shot list.
              </p>

              <Link
                href={bookingHref}
                className="group mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-bone text-[14px] font-medium text-ink transition-all duration-300 hover:shadow-[0_20px_50px_-24px_rgba(245,242,236,.8)]"
              >
                Continue to booking
                <ArrowUpRight
                  aria-hidden
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            </aside>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
