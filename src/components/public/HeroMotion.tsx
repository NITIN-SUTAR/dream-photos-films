"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { Camera, Play } from "lucide-react";
import { BRAND_IMAGES as IMG } from "@/lib/brand";

export function HeroMotion() {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rx = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), {
    stiffness: 110,
    damping: 18,
  });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), {
    stiffness: 110,
    damping: 18,
  });
  const tx = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), {
    stiffness: 90,
    damping: 20,
  });
  const txInverse = useTransform(tx, (v) => v * -0.6);

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  return (
    <>
      <motion.div
        animate={reduce ? { y: 0 } : { y: [0, -14, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 -z-30"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMG.heroWide.src}
          alt={IMG.heroWide.alt}
          width={IMG.heroWide.width}
          height={IMG.heroWide.height}
          className="h-[115%] w-full object-cover opacity-[0.55]"
        />
      </motion.div>

      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[radial-gradient(120%_85%_at_78%_12%,rgba(201,162,39,.16),transparent_58%),radial-gradient(90%_70%_at_12%_85%,rgba(60,70,120,.18),transparent_60%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-gradient-to-b from-ink via-ink/72 to-ink"
      />
      <div aria-hidden className="noise-layer absolute inset-0 -z-10" />

      <div
        onPointerMove={onPointerMove}
        className="absolute inset-y-0 right-[4%] z-10 hidden w-[36vw] max-w-[440px] items-center justify-center lg:flex"
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
            initial={{ opacity: 1, scale: 1, rotate: -2.5 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: [-2.5, -1.5, -2.5] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="glass-strong relative w-[320px] rounded-[18px] p-3 shadow-[0_60px_120px_-50px_rgba(0,0,0,1)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={IMG.heroPanel.src}
              alt={IMG.heroPanel.alt}
              width={IMG.heroPanel.width}
              height={IMG.heroPanel.height}
              className="aspect-[3/4] w-full rounded-[10px] object-cover"
              loading="lazy"
              decoding="async"
            />
            <figcaption className="flex items-center justify-between px-1 pb-0.5 pt-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
                35mm · f/1.4 · 1/250
              </span>
              <Camera aria-hidden className="h-3.5 w-3.5 text-accent" />
            </figcaption>
          </motion.figure>

          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={reduce ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, 12, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
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
      </div>

      <motion.div
        animate={reduce ? { opacity: 1 } : { opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
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
    </>
  );
}
