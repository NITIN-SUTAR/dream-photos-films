"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

type CursorState = "default" | "link" | "image" | "drag" | "play";

const LABELS: Record<CursorState, string> = {
  default: "",
  link: "Open",
  image: "View",
  drag: "Drag",
  play: "Play",
};

/**
 * Subtle desktop-only cursor. Elements opt in with `data-cursor="image|link|drag|play"`.
 * Hidden on touch devices and when reduced motion is requested.
 */
export function Cursor() {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [state, setState] = useState<CursorState>("default");
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 620, damping: 42, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 620, damping: 42, mass: 0.35 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setEnabled(mq.matches);
    sync();
    const onChange = () => setEnabled(mq.matches);
    if (mq.addEventListener) {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  useEffect(() => {
    if (!enabled || reduce) return;
    function onMove(e: PointerEvent) {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const target = (e.target as HTMLElement | null)?.closest?.(
        "[data-cursor],a,button",
      ) as HTMLElement | null;
      const attr = target?.dataset?.cursor as CursorState | undefined;
      if (attr) setState(attr);
      else if (target) setState("link");
      else setState("default");
    }
    const onLeave = () => setVisible(false);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled, reduce, x, y]);

  if (!enabled || reduce) return null;

  const expanded = state === "image" || state === "drag" || state === "play";

  return (
    <motion.div
      aria-hidden
      className="cursor-dot pointer-events-none fixed left-0 top-0 z-[400] hidden lg:block"
      style={{ x: sx, y: sy, opacity: visible ? 1 : 0 }}
    >
      <motion.div
        animate={{
          width: expanded ? 66 : state === "link" ? 26 : 14,
          height: expanded ? 66 : state === "link" ? 26 : 14,
          backgroundColor: expanded ? "rgba(201,162,39,0.14)" : "rgba(245,242,236,0.08)",
          borderColor: expanded ? "rgba(201,162,39,0.6)" : "rgba(245,242,236,0.45)",
        }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-[2px]"
      >
        {expanded && (
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-bone">
            {LABELS[state]}
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}
