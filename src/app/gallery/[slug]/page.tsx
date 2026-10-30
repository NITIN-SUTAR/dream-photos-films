import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteNav } from "@/components/public/SiteNav";
import { Cursor } from "@/components/public/Cursor";
import { SiteFooter } from "@/components/public/Closing";
import { ClientGallery } from "@/components/gallery/ClientGallery";
import { getGalleryAlbum, getStudioContact } from "@/server/repositories";
import { signMediaPath } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getGalleryAlbum(slug);
  return { title: result ? result.album.title : "Client gallery", robots: { index: false } };
}

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [result, contact] = await Promise.all([getGalleryAlbum(slug), getStudioContact()]);
  if (!result || !result.album.active) notFound();

  const { album, photos } = result;

  return (
    <>
      <Cursor />
      <SiteNav />
      <main id="main" className="relative min-h-screen pb-24 pt-28 sm:pt-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(70%_60%_at_40%_0%,rgba(201,162,39,.08),transparent_65%)]"
        />
        <div className="relative mx-auto w-full max-w-[1400px] px-5 sm:px-8">
          <ClientGallery
            album={{
              slug: album.slug,
              title: album.title,
              client: album.clientName,
              event: album.event,
              date: album.eventDate ? String(album.eventDate) : "",
              location: album.location,
            }}
            photos={photos.map((p) => ({
              id: p.id,
              src:
                p.externalUrl ??
                `/api/media/private-gallery/${p.storagePath}?${signMediaPath(
                  `private-gallery/${p.storagePath}`,
                  900,
                )}`,
              alt: p.alt,
              width: p.width,
              height: p.height,
            }))}
          />
        </div>
      </main>
      <SiteFooter contact={contact} />
    </>
  );
}
