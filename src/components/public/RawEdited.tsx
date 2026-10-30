"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MoveHorizontal, Sparkles } from "lucide-react";
import { BRAND_IMAGES as IMG } from "@/lib/brand";
import { Reveal, SectionHeader } from "@/components/ui/primitives";

const RAW_FILTER =
  "saturate(0.55) contrast(0.82) brightness(1.06) sepia(0.06) blur(0.2px)";
const EDITED_FILTER = "saturate(1.16) contrast(1.12) brightness(0.99)";

const NOTES = [
  { label: "Exposure", value: "+0.35 EV" },
  { label: "Contrast", value: "+18" },
  { label: "Shadows", value: "+24 / lifted" },
  { label: "Temp", value: "5400K → 5750K" },
  { label: "Split tone", value: "Teal shadow · Amber high" },
  { label: "Grain", value: "Fine, 35mm" },
];

export function RawEdited() {
  const [pos, setPos] = useState(52);
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const setFromClientX = useCallback((clientX: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, next)));
  }, []);

  return (
    <section
      id="raw-vs-edited"
      aria-labelledby="compare-title"
      className="relative py-24 sm:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_20%_0%,rgba(201,162,39,.07),transparent_60%)]"
      />
      <div className="relative mx-auto w-full max-w-[1500px] px-5 sm:px-8">
        <Reveal>
          <SectionHeader
            index="03"
            eyebrow="Post-production"
            title={
              <span id="compare-title">
                RAW <span className="text-muted/50">/</span>{" "}
                <em className="not-italic text-accent/90">EDITED</em>
              </span>
            }
            description="Colour is not a filter we apply at the end — it is decided on set and finished frame by frame in the studio. Drag the handle, or focus it and use the arrow keys."
          />
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-12 grid gap-8 lg:grid-cols-[1.6fr_0.4fr] lg:items-end">
            <div
              ref={stageRef}
              onPointerDown={(e) => {
                (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                setDragging(true);
                setFromClientX(e.clientX);
              }}
              onPointerMove={(e) => dragging && setFromClientX(e.clientX)}
              onPointerUp={() => setDragging(false)}
              onPointerCancel={() => setDragging(false)}
              data-cursor="drag"
              className="relative aspect-[4/3] w-full touch-none select-none overflow-hidden rounded-[10px] bg-ink-3 sm:aspect-[16/9]"
            >
              {/* EDITED (base) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMG.compare.src}
                alt="Final graded photograph — warm highlights, deep controlled shadows"
                width={IMG.compare.width}
                height={IMG.compare.height}
                sizes="(max-width: 1024px) 100vw, 66vw"
                loading="lazy"
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover"
                style={{ filter: EDITED_FILTER }}
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-tr from-[rgba(20,40,60,.25)] via-transparent to-[rgba(201,162,39,.16)] mix-blend-soft-light"
              />

              {/* RAW (clipped overlay) */}
              <div
                className="absolute inset-0"
                style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={IMG.compare.src}
                  alt="Unedited camera RAW file — flat contrast and neutral colour"
                  width={IMG.compare.width}
                  height={IMG.compare.height}
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  loading="lazy"
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ filter: RAW_FILTER }}
                />
                <div aria-hidden className="absolute inset-0 bg-[#8a8f9a]/12" />
              </div>

              {/* labels */}
              <span className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/12 bg-ink/45 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-bone/80 backdrop-blur">
                Raw
              </span>
              <span className="pointer-events-none absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-accent/35 bg-ink/45 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-accent backdrop-blur">
                <Sparkles aria-hidden className="h-3 w-3" /> Edited
              </span>

              {/* handle */}
              <div
                className="pointer-events-none absolute inset-y-0 z-10 w-px bg-bone/80 shadow-[0_0_24px_rgba(245,242,236,.45)]"
                style={{ left: `${pos}%` }}
              />
              <button
                type="button"
                role="slider"
                aria-label="Compare raw and edited photograph"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(pos)}
                aria-valuetext={`${Math.round(pos)}% raw`}
                aria-orientation="horizontal"
                onKeyDown={(e) => {
                  const step = e.shiftKey ? 10 : 2;
                  if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    setPos((p) => Math.max(0, p - step));
                  }
                  if (e.key === "ArrowRight") {
                    e.preventDefault();
                    setPos((p) => Math.min(100, p + step));
                  }
                  if (e.key === "Home") setPos(0);
                  if (e.key === "End") setPos(100);
                }}
                style={{ left: `${pos}%` }}
                className="absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full"
              >
                <motion.span
                  animate={{ scale: dragging ? 1.12 : 1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  className="flex h-12 w-12 items-center justify-center rounded-full glass-strong"
                >
                  <MoveHorizontal aria-hidden className="h-4 w-4 text-bone" />
                </motion.span>
              </button>
            </div>

            {/* grade notes */}
            <div className="glass rounded-[14px] p-5">
              <p className="eyebrow">Studio grade sheet</p>
              <p className="display mt-2 text-[22px] text-bone">Alibaug · 85mm</p>
              <dl className="mt-5 divide-y divide-white/8">
                {NOTES.map((n) => (
                  <div key={n.label} className="flex items-center justify-between py-2.5">
                    <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                      {n.label}
                    </dt>
                    <dd className="text-[12.5px] text-bone">{n.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    animate={{ width: `${pos}%` }}
                    transition={{ type: "spring", stiffness: 260, damping: 32 }}
                  />
                </div>
                <span className="font-mono text-[10px] text-muted">{Math.round(pos)}%</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
