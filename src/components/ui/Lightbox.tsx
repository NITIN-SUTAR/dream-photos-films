"use client";

import { useCallback, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ResponsiveImage } from "@/lib/types";
import { IconButton } from "./primitives";
import { useBodyLock, useEscape, useFocusTrap } from "./overlays";

export interface LightboxItem {
  id: string;
  image: ResponsiveImage;
  title: string;
  meta?: string;
  description?: string;
}

export function Lightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: {
  items: LightboxItem[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const open = index !== null;
  const reduce = useReducedMotion();
  const trapRef = useFocusTrap<HTMLDivElement>(open);
  useBodyLock(open);
  useEscape(open, onClose);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (index === null || !items.length) return;
      onIndexChange((index + dir + items.length) % items.length);
    },
    [index, items.length, onIndexChange],
  );

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  const item = index !== null ? items[index] : null;

  return (
    <AnimatePresence>
      {open && item && (
        <motion.div
          ref={trapRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${item.title} — image ${index! + 1} of ${items.length}`}
          tabIndex={-1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[150] flex flex-col bg-ink/95 backdrop-blur-xl"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_0%,rgba(201,162,39,.08),transparent_70%)]"
          />
          <header className="relative z-10 flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
            <div className="min-w-0">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.24em] text-accent">
                {item.meta}
              </p>
              <h2 className="display truncate text-[20px] text-bone sm:text-[26px]">
                {item.title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden font-mono text-[11px] text-muted sm:block">
                {String(index! + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
              </span>
              <IconButton label="Close preview" icon={X} onClick={onClose} />
            </div>
          </header>

          <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-8">
            <IconButton
              label="Previous image"
              icon={ChevronLeft}
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 sm:left-6"
            />
            <AnimatePresence mode="wait" initial={false}>
              <motion.figure
                key={item.id}
                drag={reduce ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.14}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -70) go(1);
                  else if (info.offset.x > 70) go(-1);
                }}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex max-h-full min-h-0 w-full max-w-5xl cursor-grab flex-col items-center active:cursor-grabbing"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image.src}
                  alt={item.image.alt}
                  width={item.image.width}
                  height={item.image.height}
                  className="max-h-[68vh] w-auto max-w-full rounded-[6px] object-contain shadow-[0_40px_120px_-40px_rgba(0,0,0,1)]"
                />
                {item.description && (
                  <figcaption className="mt-4 max-w-2xl px-4 text-center text-[13px] leading-relaxed text-muted">
                    {item.description}
                  </figcaption>
                )}
              </motion.figure>
            </AnimatePresence>
            <IconButton
              label="Next image"
              icon={ChevronRight}
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 sm:right-6"
            />
          </div>

          <footer className="relative z-10 hidden items-center justify-center gap-2 pb-6 md:flex">
            {items.slice(0, 14).map((t, i) => (
              <button
                key={t.id}
                type="button"
                aria-label={`Show ${t.title}`}
                aria-current={i === index}
                onClick={() => onIndexChange(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === index ? "w-8 bg-accent" : "w-4 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </footer>
          <p className="relative z-10 pb-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted/60 md:hidden">
            Swipe or use arrows
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
