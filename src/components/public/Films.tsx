"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Clock, Film, Play, Volume2, VolumeX } from "lucide-react";
import type { FilmDTO } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Reveal, SectionHeader } from "@/components/ui/primitives";

function FilmStage({ film, priority }: { film: FilmDTO; priority?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <figure className="group relative overflow-hidden rounded-[10px] bg-ink-3">
      <div className="relative aspect-[16/10] w-full sm:aspect-[16/9]">
        {!playing ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={film.poster.src}
              alt={film.poster.alt}
              width={film.poster.width}
              height={film.poster.height}
              sizes="(max-width: 1024px) 100vw, 50vw"
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-ink/10"
            />
            <button
              type="button"
              data-cursor="play"
              onClick={() => setPlaying(true)}
              aria-label={`Play preview of ${film.title}`}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="relative flex h-20 w-20 items-center justify-center rounded-full glass-strong transition-transform duration-500 group-hover:scale-105">
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full border border-accent/30 transition-all duration-700 group-hover:scale-125 group-hover:opacity-0"
                />
                <Play aria-hidden className="ml-0.5 h-6 w-6 fill-bone text-bone" />
              </span>
            </button>
          </>
        ) : (
          <>
            <video
              ref={videoRef}
              src={film.video}
              poster={film.poster.src}
              autoPlay
              loop
              muted={muted}
              playsInline
              preload="none"
              controls={false}
              aria-label={`${film.title} preview clip`}
              className="h-full w-full object-cover"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-transparent"
            />
            <div className="absolute right-4 top-4 flex gap-2">
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? "Unmute preview" : "Mute preview"}
                className="glass inline-flex h-9 w-9 items-center justify-center rounded-full text-bone"
              >
                {muted ? (
                  <VolumeX aria-hidden className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 aria-hidden className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setPlaying(false)}
                className="glass inline-flex h-9 items-center rounded-full px-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-bone"
              >
                Stop
              </button>
            </div>
          </>
        )}
      </div>

      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-7">
        <div>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-accent">
            {film.category}
          </p>
          <h3 className="display mt-1.5 text-[26px] text-bone sm:text-[32px]">{film.title}</h3>
          <p className="mt-2 max-w-md text-[12.5px] leading-relaxed text-muted">
            {film.description}
          </p>
        </div>
        <span className="hidden shrink-0 items-center gap-1.5 rounded-full glass px-3 py-1.5 font-mono text-[10px] text-muted sm:inline-flex">
          <Clock aria-hidden className="h-3 w-3" />
          {film.duration}
        </span>
      </figcaption>
    </figure>
  );
}

export function Films({ films }: { films: FilmDTO[] }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const stripX = useTransform(scrollYProgress, [0, 1], ["2%", reduce ? "2%" : "-8%"]);

  const active = films;
  const featured = active.filter((f) => f.featured).slice(0, 2);
  const rest = active.filter((f) => !f.featured);

  return (
    <section
      id="films"
      ref={ref}
      aria-labelledby="films-title"
      className="relative overflow-hidden border-y border-white/6 bg-ink-2/60 py-24 sm:py-32"
    >
      <motion.div
        aria-hidden
        style={{ x: stripX }}
        className="pointer-events-none absolute -top-6 left-0 w-[130%] select-none whitespace-nowrap font-[family-name:var(--font-display)] text-[16vw] leading-none text-white/[0.022]"
      >
        CINEMATIC FILMS · CINEMATIC FILMS ·
      </motion.div>

      <div className="relative mx-auto w-full max-w-[1500px] px-5 sm:px-8">
        <Reveal>
          <SectionHeader
            index="02"
            eyebrow="Films"
            title={
              <span id="films-title">
                Motion, sound and <em className="not-italic text-accent/90">time</em>
              </span>
            }
            description="Two short previews below. Full films are shared privately with each family — these are the 5–10 second cuts we can show publicly."
          />
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {featured.map((film, i) => (
            <Reveal key={film.id} delay={i * 0.1}>
              <FilmStage film={film} priority={i === 0} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.12}>
          <ul className="mt-10 divide-y divide-white/8 border-t border-white/8">
            {rest.map((film) => (
              <li key={film.id}>
                <div className="group flex items-center gap-5 py-5 transition-colors duration-300 hover:bg-white/[0.02]">
                  <div className="relative hidden h-16 w-28 shrink-0 overflow-hidden rounded-[6px] sm:block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={film.poster.src}
                      alt={film.poster.alt}
                      width={film.poster.width}
                      height={film.poster.height}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-ink/40">
                      <Play aria-hidden className="h-3.5 w-3.5 fill-bone/80 text-bone/80" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-muted">
                      {film.category}
                    </p>
                    <h3 className="display mt-1 text-[20px] text-bone">{film.title}</h3>
                    <p className="mt-1 line-clamp-1 text-[12.5px] text-muted">
                      {film.description}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "hidden shrink-0 items-center gap-1.5 font-mono text-[10.5px] text-muted md:inline-flex",
                    )}
                  >
                    <Film aria-hidden className="h-3 w-3" />
                    {film.duration}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
