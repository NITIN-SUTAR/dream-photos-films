"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import type { TestimonialDTO } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/primitives";

export function Testimonials({ items }: { items: TestimonialDTO[] }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const reduce = useReducedMotion();

  const go = useCallback(
    (d: 1 | -1) => {
      setDir(d);
      setIndex((i) => (i + d + items.length) % items.length);
    },
    [items.length],
  );

  const t = items[index];
  if (!t) return null;

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-title"
      aria-roledescription="carousel"
      className="relative overflow-hidden py-24 sm:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_100%,rgba(201,162,39,.07),transparent_65%)]"
      />
      <div className="relative mx-auto w-full max-w-[1500px] px-5 sm:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="font-mono text-[11px] text-accent">08</span>
                <span aria-hidden className="h-px w-8 bg-gradient-to-r from-accent/70 to-transparent" />
                <span className="eyebrow">Testimonials</span>
              </div>
              <h2
                id="testimonials-title"
                className="display text-[clamp(2rem,5vw,3.6rem)] text-bone"
              >
                In their words
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="mr-2 font-mono text-[11px] text-muted">
                {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous testimonial"
                className="glass inline-flex h-11 w-11 items-center justify-center rounded-full text-bone transition-colors hover:bg-white/10"
              >
                <ChevronLeft aria-hidden className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next testimonial"
                className="glass inline-flex h-11 w-11 items-center justify-center rounded-full text-bone transition-colors hover:bg-white/10"
              >
                <ChevronRight aria-hidden className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Reveal>

        <div
          className="relative mt-12 min-h-[24rem]"
          aria-live="polite"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(1);
            if (e.key === "ArrowLeft") go(-1);
          }}
          tabIndex={0}
          role="group"
          aria-label="Client testimonials — use arrow keys to browse"
        >
          <AnimatePresence mode="wait" custom={dir}>
            <motion.figure
              key={t.id}
              custom={dir}
              drag={reduce ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              onDragEnd={(_, info) => {
                if (info.offset.x < -70) go(1);
                else if (info.offset.x > 70) go(-1);
              }}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center"
            >
              <div>
                <Quote aria-hidden className="h-8 w-8 rotate-180 text-accent/50" />
                <blockquote className="mt-5">
                  <p className="display text-[clamp(1.6rem,3.6vw,2.9rem)] leading-[1.18] text-bone">
                    {t.quote}
                  </p>
                </blockquote>
                <figcaption className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <span className="text-[15px] text-bone">{t.name}</span>
                  <span aria-hidden className="h-4 w-px bg-white/15" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                    {t.event} · {t.location}
                  </span>
                  <span className="flex items-center gap-0.5" aria-label={`${t.rating} out of 5`}>
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} aria-hidden className="h-3 w-3 fill-accent text-accent" />
                    ))}
                  </span>
                </figcaption>
              </div>
              {t.image && (
                <div className="relative hidden aspect-[4/5] overflow-hidden rounded-[10px] bg-ink-3 lg:block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.image.src}
                    alt={t.image.alt}
                    width={1200}
                    height={1500}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent"
                  />
                </div>
              )}
            </motion.figure>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setDir(i > index ? 1 : -1);
                setIndex(i);
              }}
              aria-label={`Show testimonial from ${item.name}`}
              aria-current={i === index}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                i === index ? "w-12 bg-accent" : "w-6 bg-white/15 hover:bg-white/35",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
