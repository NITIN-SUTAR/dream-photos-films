import { SiteNav } from "@/components/public/SiteNav";
import { Cursor } from "@/components/public/Cursor";
import { Hero } from "@/components/public/Hero";
import { Portfolio } from "@/components/public/Portfolio";
import { Films } from "@/components/public/Films";
import { RawEdited } from "@/components/public/RawEdited";
import { LightLab } from "@/components/public/LightLab";
import { Services } from "@/components/public/Services";
import { Packages } from "@/components/public/Packages";
import { About } from "@/components/public/About";
import { Testimonials } from "@/components/public/Testimonials";
import { BookingCta, Contact, SiteFooter } from "@/components/public/Closing";
import { EmptyStateWithIcon } from "@/components/public/EmptyStateWithIcon";

import {
  getStudioContact,
  listExtras,
  listFilms,
  listPackages,
  listPortfolio,
  listServices,
  listTestimonials,
} from "@/server/repositories";

export const revalidate = 300;

export default async function HomePage() {
  const [portfolio, films, services, packages, extras, testimonials, contact] =
    await Promise.all([
      listPortfolio(),
      listFilms(),
      listServices(),
      listPackages(),
      listExtras(),
      listTestimonials(),
      getStudioContact(),
    ]);

  const weddingServiceId = services.find((s) => s.slug === "wedding")?.id ?? null;

  return (
    <>
      <Cursor />
      <SiteNav />
      <main id="main">
        <Hero />
        {portfolio.length > 0 ? (
          <Portfolio items={portfolio} />
        ) : (
          <section id="portfolio" className="mx-auto w-full max-w-3xl px-5 py-24">
            <EmptyStateWithIcon
  type="camera"
  title="The archive is being re-edited"
  description="Selected works will appear here as soon as the studio publishes them."
/>

          </section>
        )}
        {films.length > 0 ? (
          <Films films={films} />
        ) : (
          <section id="films" className="mx-auto w-full max-w-3xl px-5 py-24">
            <EmptyStateWithIcon
  type="film"
  title="No films published yet"
  description="Cinematic previews will be shown here once the studio publishes them."
/>

          </section>
        )}
        <RawEdited />
        <LightLab />
        <Services services={services} />
        {packages.length > 0 && (
          <Packages
            packages={packages}
            extras={extras}
            weddingServiceId={weddingServiceId}
          />
        )}
        <About />
        {testimonials.length > 0 && <Testimonials items={testimonials} />}
        <BookingCta contact={contact} />
        <Contact contact={contact} />
      </main>
      <SiteFooter contact={contact} />
    </>
  );
}
