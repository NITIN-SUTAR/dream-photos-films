"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ARTIST } from "@/lib/brand";
import { Reveal } from "@/components/ui/primitives";

export function About() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-4%", reduce ? "-4%" : "8%"]);
  const badgeY = useTransform(scrollYProgress, [0, 1], ["12%", reduce ? "12%" : "-14%"]);

  return (
    <section id="about" ref={ref} aria-labelledby="about-title" className="relative py-24 sm:py-32">
      <div className="mx-auto w-full max-w-[1500px] px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          {/* portrait */}
          <Reveal className="relative">
            <div className="relative">
              <div className="relative aspect-[3/4] overflow-hidden rounded-[10px] bg-ink-3">
                <motion.img
                  style={{ y: imgY }}
                  src={ARTIST.portrait.src}
                  alt={`${ARTIST.name}, ${ARTIST.role}`}
                  width={ARTIST.portrait.width}
                  height={ARTIST.portrait.height}
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  loading="lazy"
                  className="h-[110%] w-full object-cover"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_20%_10%,rgba(201,162,39,.14),transparent_60%)] mix-blend-screen"
                />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-accent">
                    {ARTIST.role}
                  </p>
                  <p className="display mt-1.5 text-[30px] text-bone">{ARTIST.name}</p>
                </div>
              </div>
              <motion.div
                style={{ y: badgeY }}
                className="glass-strong absolute -right-4 top-8 hidden w-40 rounded-[12px] p-4 sm:block"
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
                  Working since
                </p>
                <p className="display mt-1 text-[34px] text-bone">{ARTIST.since}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  Kutch · Surat · Thane
                </p>
              </motion.div>
            </div>
          </Reveal>

          {/* story */}
          <div className="flex flex-col justify-center">
            <Reveal>
              <div className="mb-5 flex items-center gap-3">
                <span className="font-mono text-[11px] text-accent">07</span>
                <span aria-hidden className="h-px w-8 bg-gradient-to-r from-accent/70 to-transparent" />
                <span className="eyebrow">About the artist</span>
              </div>
              <h2 id="about-title" className="display text-[clamp(2rem,4.6vw,3.4rem)] text-bone">
                I photograph the day you <em className="not-italic text-accent/90">remember</em>,
                not the day that was scheduled.
              </h2>
            </Reveal>

            {ARTIST.story.map((p, i) => (
              <Reveal key={i} delay={0.08 + i * 0.06}>
                <p className="mt-6 max-w-2xl text-[15px] leading-[1.85] text-muted">{p}</p>
              </Reveal>
            ))}

            <Reveal delay={0.2}>
              <dl className="mt-10 grid gap-px overflow-hidden rounded-[14px] border border-white/8 bg-white/8 sm:grid-cols-3">
                {ARTIST.philosophy.map((ph) => (
                  <div key={ph.label} className="bg-ink-2 p-5">
                    <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                      {ph.label}
                    </dt>
                    <dd className="mt-2.5 text-[12.5px] leading-relaxed text-muted">{ph.text}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            <Reveal delay={0.26}>
              <blockquote className="mt-10 border-l border-accent/40 pl-5">
                <p className="display text-[22px] leading-snug text-bone/90">
                  &ldquo;If the photograph does not make you feel what the room felt, it is just
                  a record. We are not in the record business.&rdquo;
                </p>
                <footer className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                  — {ARTIST.name}
                </footer>
              </blockquote>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
