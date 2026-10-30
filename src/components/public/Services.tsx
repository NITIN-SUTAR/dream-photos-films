"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";
import type { ServiceDTO } from "@/lib/api";
import { cn, formatINR } from "@/lib/utils";
import { Reveal, SectionHeader } from "@/components/ui/primitives";

export function Services({ services }: { services: ServiceDTO[] }) {
  const [active, setActive] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const signature = services.filter((s) => s.category === "Signature");
  const addons = services.filter((s) => s.category === "Add-on");
  const activeService = signature.find((s) => s.id === active) ?? null;

  return (
    <section id="services" aria-labelledby="services-title" className="relative py-24 sm:py-32">
      <div className="mx-auto w-full max-w-[1500px] px-5 sm:px-8">
        <Reveal>
          <SectionHeader
            index="05"
            eyebrow="Services"
            title={<span id="services-title">What we are booked for</span>}
            description="Transparent starting prices. Every quote is built from a real shot list — crew size, hours, deliverables and travel."
            actions={
              <Link
                href="/booking"
                className="group inline-flex items-center gap-2 rounded-full border border-white/12 px-5 py-2.5 text-[13px] text-bone transition-colors hover:border-accent/50 hover:text-accent-soft"
              >
                Build an estimate
                <ArrowUpRight
                  aria-hidden
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            }
          />
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_360px]">
          {/* editorial index */}
          <ul className="border-t border-white/10">
            {signature.map((s, i) => {
              const isActive = active === s.id;
              return (
                <Reveal key={s.id} delay={i * 0.05} y={18}>
                  <li
                    className="group border-b border-white/10"
                    onMouseEnter={() => setActive(s.id)}
                    onFocus={() => setActive(s.id)}
                  >
                    <div className="relative flex flex-col gap-4 py-7 transition-colors duration-500 sm:flex-row sm:items-center sm:gap-8">
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-x-0 -z-10 h-full origin-left scale-x-0 bg-gradient-to-r from-white/[0.05] to-transparent transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)]",
                          isActive && "scale-x-100",
                        )}
                      />
                      <span className="font-mono text-[10.5px] text-accent sm:w-12">
                        0{i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3
                          className={cn(
                            "display text-[28px] leading-tight text-bone transition-transform duration-500 sm:text-[38px]",
                            isActive && "sm:translate-x-1.5",
                          )}
                        >
                          {s.name}
                        </h3>
                        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">
                          {s.description}
                        </p>
                        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                          {s.details.map((d) => (
                            <li
                              key={d}
                              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted/80"
                            >
                              <Check aria-hidden className="h-3 w-3 text-accent/70" />
                              {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
                        <div className="text-right">
                          <p className="display text-[24px] text-bone">{formatINR(s.price)}</p>
                          <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">
                            {s.priceNote}
                          </p>
                        </div>
                        <Link
                          href={`/booking?service=${s.id}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-4 py-2 text-[12px] text-muted transition-all duration-300 hover:border-accent/50 hover:text-accent-soft"
                        >
                          Book
                          <ArrowUpRight aria-hidden className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </li>
                </Reveal>
              );
            })}
          </ul>

          {/* preview column */}
          <div className="hidden lg:block">
            <div className="sticky top-28">
              <div className="relative aspect-[3/4] overflow-hidden rounded-[10px] bg-ink-3">
                <AnimatePresence mode="wait">
                  {activeService?.image ? (
                    <motion.img
                      key={activeService.id}
                      src={activeService.image.src}
                      alt={activeService.image.alt}
                      width={1200}
                      height={1500}
                      loading="lazy"
                      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(70%_60%_at_50%_30%,rgba(201,162,39,.10),transparent_70%)]"
                    >
                      <p className="max-w-[16rem] px-6 text-center font-mono text-[10px] uppercase leading-relaxed tracking-[0.2em] text-muted">
                        Hover a service to preview the work
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent"
                />
              </div>
              <p className="mt-4 text-[12px] leading-relaxed text-muted">
                Prices shown are starting points for planning. Multi-day events, travel and
                additional crew are quoted per enquiry.
              </p>
            </div>
          </div>
        </div>

        {/* add-ons */}
        <Reveal delay={0.1}>
          <div className="mt-16">
            <p className="eyebrow">Also available</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {addons.map((s) => (
                <li
                  key={s.id}
                  className="group rounded-[12px] border border-white/8 bg-white/[0.02] p-4 transition-all duration-500 hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.04]"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-[14px] text-bone">{s.name}</h3>
                    <span className="font-mono text-[11px] text-accent">
                      {formatINR(s.price)}
                    </span>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-muted">{s.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
