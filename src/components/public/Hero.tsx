import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { HeroMotion } from "@/components/public/HeroMotion";
import { ARTIST } from "@/lib/brand";

const WORDS = ["Light", "held", "still,", "stories", "kept", "moving."];

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate min-h-[100svh] w-full overflow-hidden pb-16 pt-28 sm:pb-24 sm:pt-32"
    >
      <HeroMotion />

      <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
        <div className="relative z-10">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full glass px-4 py-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-muted">
              Booking {new Date().getFullYear()} · Maharashtra &amp; Gujarat
            </span>
          </div>

          <h1
            id="hero-title"
            className="display text-[clamp(2.9rem,9.2vw,7.4rem)] leading-[0.92] text-bone"
          >
            {WORDS.map((w, i) => (
              <span key={w + i} className="inline-block pb-[0.06em]">
                <span className="inline-block">
                  {i === 3 || i === 4 || i === 5 ? (
                    <em className="not-italic text-accent/90">{w}</em>
                  ) : (
                    w
                  )}
                  {i < WORDS.length - 1 && "\u00A0"}
                </span>
              </span>
            ))}
          </h1>

          <p className="mt-7 max-w-lg text-[15px] leading-relaxed text-muted sm:text-[16.5px]">
            DREAM PHOTO&apos;S &amp; FILM&apos;S is a photography and filmmaking studio
            built around one idea — the frames you keep should feel exactly like the day
            felt. Weddings, pre-weddings, events, portraits and short cinema.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
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
          </div>

          <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-5 border-t border-white/8 pt-7">
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
          </dl>
        </div>
      </div>
    </section>
  );
}
