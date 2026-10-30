"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Sun } from "lucide-react";
import { BRAND_IMAGES as IMG } from "@/lib/brand";
import { Reveal, SectionHeader } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

interface LightState {
  intensity: number; // 0–100
  x: number; // 0–100 (position across the frame)
  y: number; // 0–100
  direction: number; // 0–360 degrees, where the shadow falls
  softness: number; // 0–100
  temperature: number; // 2000–9000 K
  atmosphere: number; // 0–100
}

const DEFAULT_STATE: LightState = {
  intensity: 64,
  x: 28,
  y: 26,
  direction: 135,
  softness: 52,
  temperature: 5200,
  atmosphere: 32,
};

const PRESETS: { name: string; note: string; state: LightState }[] = [
  {
    name: "Rembrandt",
    note: "45° key, hard falloff",
    state: { intensity: 72, x: 24, y: 20, direction: 140, softness: 26, temperature: 4600, atmosphere: 22 },
  },
  {
    name: "Soft Window",
    note: "Large source, wrapped",
    state: { intensity: 58, x: 16, y: 40, direction: 100, softness: 88, temperature: 6100, atmosphere: 34 },
  },
  {
    name: "Golden Hour",
    note: "Low warm key",
    state: { intensity: 76, x: 78, y: 62, direction: 300, softness: 64, temperature: 3000, atmosphere: 56 },
  },
  {
    name: "Blue Backlight",
    note: "Cool rim, deep base",
    state: { intensity: 84, x: 62, y: 12, direction: 250, softness: 38, temperature: 8400, atmosphere: 48 },
  },
];

/** Rough Kelvin → RGB approximation, good enough for a visual demo. */
function kelvinToRgb(k: number): string {
  const t = k / 100;
  let r: number, g: number, b: number;
  if (t <= 66) {
    r = 255;
    g = 99.47 * Math.log(t) - 161.12;
    b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04;
  } else {
    r = 329.7 * Math.pow(t - 60, -0.133);
    g = 288.12 * Math.pow(t - 60, -0.0755);
    b = 255;
  }
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v)));
  return `${c(r)}, ${c(g)}, ${c(b)}`;
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          {label}
        </label>
        <span className="font-mono text-[11px] text-bone/80">
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function LightLab() {
  const [s, setS] = useState<LightState>(DEFAULT_STATE);
  const [preset, setPreset] = useState<string | null>(null);
  const padRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef(false);

  const update = useCallback(<K extends keyof LightState>(key: K, value: LightState[K]) => {
    setPreset(null);
    setS((cur) => ({ ...cur, [key]: value }));
  }, []);

  const rgb = useMemo(() => kelvinToRgb(s.temperature), [s.temperature]);
  const spread = 26 + s.softness * 0.55;
  const keyOpacity = s.intensity / 100;
  const shadowStrength = (1 - s.intensity / 130) * 0.85;

  const setPadFrom = useCallback((clientX: number, clientY: number) => {
    const rect = padRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPreset(null);
    setS((cur) => ({
      ...cur,
      x: Math.round(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))),
      y: Math.round(Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100))),
    }));
  }, []);

  return (
    <section
      id="light-lab"
      aria-labelledby="lab-title"
      className="relative overflow-hidden border-y border-white/6 bg-ink-2/50 py-24 sm:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_80%_20%,rgba(120,140,200,.09),transparent_60%)]"
      />
      <div className="relative mx-auto w-full max-w-[1500px] px-5 sm:px-8">
        <Reveal>
          <SectionHeader
            index="04"
            eyebrow="Virtual Light Lab"
            title={
              <span id="lab-title">
                Move the light. <em className="not-italic text-accent/90">Change the story.</em>
              </span>
            }
            description="An interactive demonstration of how we shape a portrait before a single frame is taken. Drag the light on the stage, or use the studio controls."
          />
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          {/* stage */}
          <Reveal>
            <div
              ref={padRef}
              onPointerDown={(e) => {
                (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                dragRef.current = true;
                setPadFrom(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => dragRef.current && setPadFrom(e.clientX, e.clientY)}
              onPointerUp={() => (dragRef.current = false)}
              onPointerCancel={() => (dragRef.current = false)}
              data-cursor="drag"
              className="relative aspect-[4/5] w-full touch-none overflow-hidden rounded-[10px] bg-ink-3 sm:aspect-[4/3] lg:aspect-[5/6]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMG.lab.src}
                alt="Studio portrait used to demonstrate lighting changes"
                width={IMG.lab.width}
                height={IMG.lab.height}
                sizes="(max-width: 1024px) 100vw, 55vw"
                loading="lazy"
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-300"
                style={{
                  filter: `brightness(${0.52 + keyOpacity * 0.55}) contrast(${
                    1.22 - s.softness / 420
                  }) saturate(${0.85 + (s.temperature < 5000 ? 0.25 : 0.05)})`,
                }}
              />

              {/* shadow side */}
              <div
                aria-hidden
                className="absolute inset-0 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(${s.direction}deg, rgba(4,4,8,${shadowStrength}) 0%, rgba(4,4,8,${
                    shadowStrength * 0.45
                  }) 42%, rgba(0,0,0,0) 72%)`,
                  mixBlendMode: "multiply",
                }}
              />

              {/* key light */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(${spread}% ${spread * 1.15}% at ${s.x}% ${s.y}%, rgba(${rgb},${
                    0.1 + keyOpacity * 0.72
                  }) 0%, rgba(${rgb},${keyOpacity * 0.26}) 40%, rgba(${rgb},0) 72%)`,
                  mixBlendMode: "screen",
                  filter: `blur(${s.softness / 12}px)`,
                }}
              />

              {/* atmosphere */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(${s.direction + 180}deg, rgba(${rgb},${
                    (s.atmosphere / 100) * 0.22
                  }), rgba(10,12,20,${(s.atmosphere / 100) * 0.42}))`,
                  mixBlendMode: "soft-light",
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  boxShadow: `inset 0 0 ${120 + s.atmosphere}px rgba(4,4,8,${
                    0.5 + s.atmosphere / 260
                  })`,
                }}
              />

              {/* light marker */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                animate={{ left: `${s.x}%`, top: `${s.y}%` }}
                transition={{ type: "spring", stiffness: 240, damping: 28 }}
              >
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-accent/50 bg-accent/10 backdrop-blur-[2px]">
                  <Sun className="h-4 w-4 text-accent" />
                  <span className="absolute -inset-3 rounded-full border border-accent/15" />
                </span>
              </motion.div>

              <p className="pointer-events-none absolute bottom-4 left-4 font-mono text-[9.5px] uppercase tracking-[0.2em] text-bone/60">
                Key {s.intensity}% · {s.temperature}K · Soft {s.softness}%
              </p>
            </div>
          </Reveal>

          {/* controls */}
          <Reveal delay={0.08}>
            <div className="glass flex h-full flex-col gap-5 rounded-[14px] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">Studio console</p>
                  <p className="display mt-1 text-[20px]">Lighting controls</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setS(DEFAULT_STATE);
                    setPreset(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:border-white/25 hover:text-bone"
                >
                  <RotateCcw aria-hidden className="h-3 w-3" /> Reset
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setS(p.state);
                      setPreset(p.name);
                    }}
                    aria-pressed={preset === p.name}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-left text-[11.5px] transition-all duration-300",
                      preset === p.name
                        ? "border-accent/50 bg-accent/12 text-accent-soft"
                        : "border-white/10 text-muted hover:border-white/25 hover:text-bone",
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <Slider
                  label="Intensity"
                  value={s.intensity}
                  min={5}
                  max={100}
                  unit="%"
                  onChange={(v) => update("intensity", v)}
                />
                <Slider
                  label="Softness"
                  value={s.softness}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(v) => update("softness", v)}
                />
                <Slider
                  label="Colour temperature"
                  value={s.temperature}
                  min={2000}
                  max={9000}
                  step={100}
                  unit="K"
                  onChange={(v) => update("temperature", v)}
                />
                <Slider
                  label="Shadow direction"
                  value={s.direction}
                  min={0}
                  max={360}
                  unit="°"
                  onChange={(v) => update("direction", v)}
                />
                <Slider
                  label="Light position X"
                  value={s.x}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(v) => update("x", v)}
                />
                <Slider
                  label="Light position Y"
                  value={s.y}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(v) => update("y", v)}
                />
                <Slider
                  label="Background atmosphere"
                  value={s.atmosphere}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(v) => update("atmosphere", v)}
                />
              </div>

              <div className="mt-auto flex items-center gap-3 rounded-[10px] border border-white/8 bg-white/[0.02] p-3">
                <span
                  aria-hidden
                  className="h-8 w-8 shrink-0 rounded-full"
                  style={{ background: `rgb(${rgb})` }}
                />
                <p className="text-[11.5px] leading-relaxed text-muted">
                  {s.temperature < 4000
                    ? "Warm tungsten key — intimate, golden, skin reads soft."
                    : s.temperature > 6800
                      ? "Cool daylight key — clean, editorial, slightly clinical."
                      : "Neutral daylight key — the everyday working balance."}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
