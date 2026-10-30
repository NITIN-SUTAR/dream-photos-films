"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Download, ImageIcon, MapPin, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface GalleryPhotoView {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface GalleryAlbumView {
  slug: string;
  title: string;
  client: string;
  event: string;
  date: string;
  location: string;
}
import { Lightbox, type LightboxItem } from "@/components/ui/Lightbox";
import { EmptyState } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/overlays";

const SPANS = [
  "sm:col-span-2 sm:row-span-2",
  "sm:col-span-1",
  "sm:col-span-1",
  "sm:col-span-1",
  "sm:col-span-2",
  "sm:col-span-1",
];

export function ClientGallery({
  album,
  photos,
}: {
  album: GalleryAlbumView;
  photos: GalleryPhotoView[];
}) {
  const [index, setIndex] = useState<number | null>(null);
  const { push } = useToast();

  const items: LightboxItem[] = photos.map((p, i) => ({
    id: p.id,
    image: { src: p.src, alt: p.alt, width: p.width, height: p.height },
    title: `${album.title} — frame ${String(i + 1).padStart(2, "0")}`,
    meta: album.event,
  }));

  return (
    <div>
      <Link
        href="/gallery"
        className="inline-flex items-center gap-2 text-[12.5px] text-muted transition-colors hover:text-bone"
      >
        <ArrowLeft aria-hidden className="h-3.5 w-3.5" /> All galleries
      </Link>

      <header className="mt-6 flex flex-wrap items-end justify-between gap-6 border-b border-white/8 pb-8">
        <div>
          <p className="eyebrow">{album.event}</p>
          <h1 className="display mt-3 text-[clamp(2.4rem,6vw,4rem)] text-bone">{album.title}</h1>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-muted">
            <li className="inline-flex items-center gap-1.5">
              <Users aria-hidden className="h-3.5 w-3.5 text-accent" /> {album.client}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden className="h-3.5 w-3.5 text-accent" />{" "}
              {formatDate(album.date)}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <MapPin aria-hidden className="h-3.5 w-3.5 text-accent" /> {album.location}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <ImageIcon aria-hidden className="h-3.5 w-3.5 text-accent" /> {photos.length}{" "}
              photographs
            </li>
          </ul>
        </div>
        <button
          type="button"
          onClick={() =>
            push({
              tone: "info",
              title: "Preparing your archive",
              description:
                "Full-resolution downloads are issued as short-lived private links by the studio.",
            })
          }
          className="glass inline-flex h-11 items-center gap-2 rounded-full px-5 text-[13px] text-bone transition-colors hover:bg-white/10"
        >
          <Download aria-hidden className="h-3.5 w-3.5" /> Download all
        </button>
      </header>

      {photos.length === 0 ? (
        <EmptyState
          className="mt-12"
          icon={ImageIcon}
          title="This gallery is still being edited"
          description="Your photographs are in post-production. We will email you the moment the gallery goes live."
        />
      ) : (
        <ul className="mt-10 grid auto-rows-[190px] grid-cols-1 gap-3 sm:grid-cols-3 sm:auto-rows-[200px] lg:grid-cols-4 lg:auto-rows-[220px]">
          {photos.map((p, i) => (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: (i % 6) * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className={SPANS[i % SPANS.length]}
            >
              <button
                type="button"
                data-cursor="image"
                onClick={() => setIndex(i)}
                aria-label={`Open frame ${i + 1} of ${photos.length}`}
                className="group relative block h-full w-full overflow-hidden rounded-[8px] bg-ink-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.src}
                  alt={p.alt}
                  width={p.width}
                  height={p.height}
                  sizes="(max-width: 640px) 100vw, 33vw"
                  loading={i < 4 ? "eager" : "lazy"}
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-[1.1s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.06]"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
                <span className="pointer-events-none absolute bottom-3 left-3 font-mono text-[9.5px] uppercase tracking-[0.18em] text-bone/0 transition-colors duration-500 group-hover:text-bone/80">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </button>
            </motion.li>
          ))}
        </ul>
      )}

      <Lightbox items={items} index={index} onClose={() => setIndex(null)} onIndexChange={setIndex} />
    </div>
  );
}
