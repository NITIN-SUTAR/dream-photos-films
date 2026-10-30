"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Camera, Play } from "lucide-react";
import { BRAND_IMAGES as IMG, ARTIST } from "@/lib/brand";

const WORDS = ["Light", "held", "still,", "stories", "kept", "moving."];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "16%"]);
  const midY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-12%"]);
  const fadeOut = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // pointer parallax for the floating panel
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), {
    stiffness: 120,
    damping: 18,
  });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), {
    stiffness: 120,
    damping: 18,
  });
  const tx = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), {
    stiffness: 90,
    damping: 20,
  });
  const txInverse = useTransform(tx, (v) => v * -0.6);

  function onPointerMove(e: React.PointerEvent) {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  return (
    <section
      ref={ref}
      onPointerMove={onPointerMove}
      aria-labelledby="hero-title"
      className="relative isolate min-h-[100svh] w-full overflow-hidden pb-16 pt-28 sm:pb-24 sm:pt-32"
    >
      {/* layer 1 — photography */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 -z-30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMG.heroWide.src}
          alt={IMG.heroWide.alt}
          width={IMG.heroWide.width}
          height={IMG.heroWide.height}
          fetchPriority="high"
          decoding="sync"
          className="h-[115%] w-full object-cover opacity-[0.55]"
        />
      </motion.div>

      {/* layer 2 — atmosphere */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[radial-gradient(120%_85%_at_78%_12%,rgba(201,162,39,.16),transparent_58%),radial-gradient(90%_70%_at_12%_85%,rgba(60,70,120,.18),transparent_60%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-gradient-to-b from-ink via-ink/72 to-ink"
      />
      <div aria-hidden className="noise-layer absolute inset-0 -z-10" />

      <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
        {/* --- copy --- */}
        <motion.div style={{ y: midY, opacity: fadeOut }} className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mb-7 inline-flex items-center gap-3 rounded-full glass px-4 py-2"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-muted">
              Booking {new Date().getFullYear()} · Maharashtra &amp; Gujarat
            </span>
          </motion.div>

          <h1
            id="hero-title"
            className="display text-[clamp(2.9rem,9.2vw,7.4rem)] leading-[0.92] text-bone"
          >
            {WORDS.map((w, i) => (
              <span key={w + i} className="inline-block overflow-hidden pb-[0.06em]">
                <motion.span
                  className="inline-block"
                  initial={reduce ? { opacity: 0 } : { y: "110%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    duration: 1,
                    delay: 0.12 + i * 0.075,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {i === 3 || i === 4 || i === 5 ? (
                    <em className="not-italic text-accent/90">{w}</em>
                  ) : (
                    w
                  )}
                  {i < WORDS.length - 1 && "\u00A0"}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.62 }}
            className="mt-7 max-w-lg text-[15px] leading-relaxed text-muted sm:text-[16.5px]"
          >
            DREAM PHOTO&apos;S &amp; FILM&apos;S is a photography and filmmaking studio
            built around one idea — the frames you keep should feel exactly like the day
            felt. Weddings, pre-weddings, events, portraits and short cinema.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.74 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/booking"
              data-cursor="link"
              className="group/btn inline-flex h-13 items-center gap-2.5 rounded-full bg-bone px-7 py-3.5 text-[14.5px] font-medium text-ink transition-all duration-500 hover:shadow-[0_22px_60px_-24px_rgba(245,242,236,.85)]"
            >
              Book Now
              <ArrowUpRight
                aria-hidden
                className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
              />
            </Link>
            <a
              href="#portfolio"
              className="group/btn inline-flex h-13 items-center gap-2.5 rounded-full glass px-7 py-3.5 text-[14.5px] text-bone transition-all duration-500 hover:bg-white/[0.08]"
            >
              Explore Work
              <ArrowDownRight
                aria-hidden
                className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-y-0.5"
              />
            </a>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.95 }}
            className="mt-12 flex flex-wrap gap-x-10 gap-y-5 border-t border-white/8 pt-7"
          >
            {[
              { k: `${ARTIST.weddings}+`, v: "Weddings documented" },
              { k: `${ARTIST.films}+`, v: "Films directed" },
              { k: `${ARTIST.cities}`, v: "Cities travelled" },
              { k: `${new Date().getFullYear() - ARTIST.since} yrs`, v: "Behind the camera" },
            ].map((s) => (
              <div key={s.v}>
                <dt className="display text-[26px] text-bone">{s.k}</dt>
                <dd className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  {s.v}
                </dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        {/* --- floating visual element --- */}
        <motion.div
          style={{ opacity: fadeOut }}
          className="relative z-10 hidden h-[560px] items-center justify-center lg:flex"
          aria-hidden
        >
          <motion.div
            style={{ rotateX: rx, rotateY: ry, x: tx, transformPerspective: 1200 }}
            animate={reduce ? undefined : { y: [0, -18, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <div className="absolute -inset-16 -z-10 rounded-full bg-[radial-gradient(circle,rgba(201,162,39,.2),transparent_65%)] blur-2xl" />
            <motion.figure
              initial={{ opacity: 0, scale: 0.94, rotate: -3 }}
              animate={{ opacity: 1, scale: 1, rotate: -2.5 }}
              transition={{ duration: 1.4, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="glass-strong relative w-[320px] rounded-[18px] p-3 shadow-[0_60px_120px_-50px_rgba(0,0,0,1)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMG.heroPanel.src}
                alt={IMG.heroPanel.alt}
                width={IMG.heroPanel.width}
                height={IMG.heroPanel.height}
                className="aspect-[3/4] w-full rounded-[10px] object-cover"
                fetchPriority="high"
              />
              <figcaption className="flex items-center justify-between px-1 pb-0.5 pt-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
                  35mm · f/1.4 · 1/250
                </span>
                <Camera aria-hidden className="h-3.5 w-3.5 text-accent" />
              </figcaption>
            </motion.figure>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.7 }}
              style={{ x: txInverse }}
              className="absolute -bottom-14 -left-24"
            >
              <motion.div
                animate={reduce ? undefined : { y: [0, 12, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                className="glass-strong w-[210px] rotate-[4deg] rounded-[14px] p-2.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={IMG.heroPortrait.src}
                  alt={IMG.heroPortrait.alt}
                  width={IMG.heroPortrait.width}
                  height={IMG.heroPortrait.height}
                  loading="lazy"
                  className="aspect-[4/5] w-full rounded-[8px] object-cover"
                />
              </motion.div>
            </motion.div>

            <motion.div
              animate={reduce ? undefined : { y: [0, -10, 0], rotate: [3, 6, 3] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
              className="absolute -right-16 top-8 flex items-center gap-2.5 rounded-full glass-strong px-4 py-2.5"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20">
                <Play aria-hidden className="h-3 w-3 fill-accent text-accent" />
              </span>
              <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted">
                Reel · 04:12
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 1 }}
        style={{ opacity: fadeOut }}
        className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
      >
        <span className="font-mono text-[9.5px] uppercase tracking-[0.3em] text-muted">
          Scroll
        </span>
        <span className="relative h-10 w-px overflow-hidden bg-white/12">
          <motion.span
            animate={reduce ? undefined : { y: ["-100%", "100%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-x-0 h-4 bg-accent"
          />
        </span>
      </motion.div>
    </section>
  );
}
