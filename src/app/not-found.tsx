import Link from "next/link";
import { ArrowUpRight, Camera } from "lucide-react";
import { BRAND_IMAGES } from "@/lib/brand";

export default function NotFound() {
  return (
    <main
      id="main"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-24 text-center"
    >
      <div className="absolute inset-0 -z-20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND_IMAGES.notFound.src}
          alt=""
          aria-hidden
          width={BRAND_IMAGES.notFound.width}
          height={BRAND_IMAGES.notFound.height}
          className="h-full w-full object-cover opacity-25"
        />
      </div>
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/85 via-ink/92 to-ink" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_40%,rgba(201,162,39,.12),transparent_65%)]"
      />
      <div aria-hidden className="noise-layer absolute inset-0 -z-10" />

      <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-muted">
        <Camera aria-hidden className="h-3 w-3 text-accent" />
        Frame not found
      </span>

      <h1 className="display mt-8 text-[clamp(5rem,22vw,14rem)] leading-[0.82] text-bone">
        404
      </h1>
      <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-muted">
        This shot never made the final edit. The page you are looking for has been moved,
        renamed, or was never published.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="group inline-flex h-13 items-center gap-2.5 rounded-full bg-bone px-8 text-[14.5px] font-medium text-ink transition-all duration-500 hover:shadow-[0_22px_60px_-24px_rgba(245,242,236,.85)]"
        >
          Return home
          <ArrowUpRight
            aria-hidden
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Link>
        <Link
          href="/#portfolio"
          className="inline-flex h-13 items-center gap-2.5 rounded-full glass px-8 text-[14.5px] text-bone transition-colors hover:bg-white/[0.08]"
        >
          Browse the portfolio
        </Link>
      </div>
    </main>
  );
}
