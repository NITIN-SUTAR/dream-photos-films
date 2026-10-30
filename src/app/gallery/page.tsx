import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Images, Lock } from "lucide-react";
import { SiteNav } from "@/components/public/SiteNav";
import { SiteFooter } from "@/components/public/Closing";
import { getStudioContact, listGalleryAlbums } from "@/server/repositories";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Client galleries",
  description: "Private editorial galleries delivered to Dream Photo's & Film's clients.",
};

export default async function GalleryIndexPage() {
  const [albums, contact] = await Promise.all([listGalleryAlbums(true), getStudioContact()]);
  return (
    <>
      <SiteNav />
      <main id="main" className="relative min-h-screen pb-24 pt-28 sm:pt-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[460px] bg-[radial-gradient(70%_60%_at_30%_0%,rgba(201,162,39,.09),transparent_65%)]"
        />
        <div className="relative mx-auto w-full max-w-[1300px] px-5 sm:px-8">
          <header className="max-w-2xl">
            <p className="eyebrow">Client galleries</p>
            <h1 className="display mt-3 text-[clamp(2.4rem,6vw,4rem)] text-bone">Your private edit</h1>
            <p className="mt-4 text-[14.5px] leading-relaxed text-muted">
              Every delivery is a private gallery. Galleries attached to a booking can only be
              opened with the private link issued to that client.
            </p>
          </header>

          {albums.length === 0 ? (
            <EmptyState
              className="mt-14"
              icon={Images}
              title="No galleries are published yet"
              description="Published client galleries will be listed here."
            />
          ) : (
            <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {albums.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/gallery/${a.slug}`}
                    className="group block overflow-hidden rounded-[12px] border border-white/8 bg-white/[0.02] transition-all duration-500 hover:-translate-y-1 hover:border-white/20"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {a.cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.cover.src}
                          alt={a.cover.alt}
                          width={1200}
                          height={900}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-[1.1s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.05]"
                        />
                      )}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 to-transparent"
                      />
                      <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-ink/50 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-bone/80 backdrop-blur">
                        <Lock aria-hidden className="h-2.5 w-2.5" /> Private
                      </span>
                    </div>
                    <div className="p-5">
                      <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-accent">{a.event}</p>
                      <h2 className="display mt-1.5 text-[24px] text-bone">{a.title}</h2>
                      <p className="mt-2 text-[12.5px] text-muted">
                        {a.date ? formatDate(a.date) : ""} · {a.location}
                      </p>
                      <p className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-bone">
                        {a.photoCount} photographs
                        <ArrowUpRight
                          aria-hidden
                          className="h-3.5 w-3.5 text-accent transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <SiteFooter contact={contact} />
    </>
  );
}
