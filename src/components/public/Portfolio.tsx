"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ImageOff, MapPin } from "lucide-react";
import { PORTFOLIO_CATEGORIES } from "@/lib/brand";
import type { PortfolioDTO } from "@/lib/api";

type PortfolioCategory = (typeof PORTFOLIO_CATEGORIES)[number];
import { cn } from "@/lib/utils";
import { SectionHeader, Reveal } from "@/components/ui/primitives";
import { Lightbox, type LightboxItem } from "@/components/ui/Lightbox";

type Filter = "All" | PortfolioCategory;
const FILTERS: Filter[] = ["All", ...PORTFOLIO_CATEGORIES];

/** Editorial layout rhythm — deliberately asymmetric, repeats every 6 items. */
const LAYOUT = [
  { span: "lg:col-span-7", ratio: "4/3", offset: "lg:mt-0" },
  { span: "lg:col-span-5", ratio: "3/4", offset: "lg:mt-16" },
  { span: "lg:col-span-4", ratio: "3/4", offset: "lg:mt-0" },
  { span: "lg:col-span-8", ratio: "16/10", offset: "lg:mt-10" },
  { span: "lg:col-span-6", ratio: "1/1", offset: "lg:mt-0" },
  { span: "lg:col-span-6", ratio: "4/5", offset: "lg:mt-20" },
];

export function Portfolio({ items: source }: { items: PortfolioDTO[] }) {
  const [filter, setFilter] = useState<Filter>("All");
  const [open, setOpen] = useState<number | null>(null);
  const reduce = useReducedMotion();

  const items = useMemo(
    () => source.filter((p) => filter === "All" || p.category === filter),
    [filter, source],
  );

  const lightboxItems: LightboxItem[] = items.map((p) => ({
    id: p.id,
    image: p.image,
    title: p.title,
    meta: `${p.category}${p.location ? ` · ${p.location}` : ""}`,
    description: p.description,
  }));

  return (
    <section id="portfolio" aria-labelledby="portfolio-title" className="relative py-24 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-ink-2/70 to-transparent"
      />
      <div className="relative mx-auto w-full max-w-[1500px] px-5 sm:px-8">
        <Reveal>
          <SectionHeader
            index="01"
            eyebrow="Selected Works"
            title={
              <span id="portfolio-title">
                Frames we would <em className="not-italic text-accent/90">print</em> ourselves
              </span>
            }
            description="A rotating edit from recent weddings, pre-weddings, events and studio sessions. Every image is graded by hand — nothing here came out of a preset."
          />
        </Reveal>

        {/* filters */}
        <Reveal delay={0.08}>
          <div
            role="group"
            aria-label="Filter portfolio by category"
            className="mt-10 flex flex-wrap items-center gap-2 border-y border-white/8 py-4"
          >
            {FILTERS.map((f) => {
              const active = f === filter;
              const count =
                f === "All"
                  ? source.length
                  : source.filter((p) => p.category === f).length;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={active}
                  className={cn(
                    "group relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] transition-colors duration-300",
                    active ? "text-ink" : "text-muted hover:text-bone",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="portfolio-filter"
                      className="absolute inset-0 rounded-full bg-bone"
                      transition={{ type: "spring", stiffness: 400, damping: 36 }}
                    />
                  )}
                  <span className="relative z-10 whitespace-nowrap">{f}</span>
                  <span
                    className={cn(
                      "relative z-10 font-mono text-[9.5px]",
                      active ? "text-ink/55" : "text-muted/60",
                    )}
                  >
                    {String(count).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* grid */}
        {items.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-3 py-20 text-center">
            <ImageOff aria-hidden className="h-6 w-6 text-muted" />
            <p className="display text-[24px]">Nothing published here yet</p>
            <p className="max-w-sm text-[13px] text-muted">
              This category is being re-edited. Try another chapter of the archive.
            </p>
          </div>
        ) : (
          <motion.ul layout className="mt-14 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-12">
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => {
                const l = LAYOUT[i % LAYOUT.length];
                return (
                  <motion.li
                    key={item.id}
                    layout={!reduce}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.98 }}
                    transition={{ duration: 0.6, delay: (i % 6) * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    className={cn("group relative", l.span, l.offset)}
                  >
                    <button
                      type="button"
                      data-cursor="image"
                      onClick={() => setOpen(i)}
                      aria-label={`Open ${item.title} — ${item.category}`}
                      className="block w-full text-left"
                    >
                      <div
                        className="relative overflow-hidden rounded-[6px] bg-ink-3"
                        style={{ aspectRatio: l.ratio }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image.src}
                          alt={item.image.alt}
                          width={item.image.width}
                          height={item.image.height}
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 40vw"
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-[1.1s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.045]"
                        />
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100"
                        />
                        {item.featured && (
                          <span className="absolute left-4 top-4 rounded-full border border-accent/35 bg-ink/50 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-accent backdrop-blur">
                            Featured
                          </span>
                        )}
                        <span
                          aria-hidden
                          className="absolute right-4 top-4 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full border border-white/20 bg-ink/40 opacity-0 backdrop-blur transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
                        >
                          <ArrowUpRight className="h-4 w-4 text-bone" />
                        </span>
                        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                          <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-accent">
                            {item.category}
                          </p>
                          <h3 className="display mt-1.5 text-[21px] text-bone transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-0.5 sm:text-[25px]">
                            {item.title}
                          </h3>
                          <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:grid-rows-[1fr] motion-reduce:grid-rows-[1fr]">
                            <div className="overflow-hidden">
                              <p className="pt-2 text-[12.5px] leading-relaxed text-muted">
                                {item.description}
                              </p>
                              {item.location && (
                                <p className="mt-2 flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted/70">
                                  <MapPin aria-hidden className="h-3 w-3" />
                                  {item.location} · {item.year}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>

      <Lightbox
        items={lightboxItems}
        index={open}
        onClose={() => setOpen(null)}
        onIndexChange={setOpen}
      />
    </section>
  );
}
