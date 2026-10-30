import { Suspense } from "react";
import type { Metadata } from "next";
import { Cursor } from "@/components/public/Cursor";
import { SiteNav } from "@/components/public/SiteNav";
import { SiteFooter } from "@/components/public/Closing";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { LoadingSkeleton } from "@/components/ui/primitives";
import { getStudioContact } from "@/server/repositories";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book a shoot",
  description:
    "Configure your photography or film booking — service, package, dates, extras and estimate.",
};

export default async function BookingPage() {
  const [contact, todayRow] = await Promise.all([
    getStudioContact(),
    db.execute<{ today: string }>(sql`select to_char(dpf_business_today(), 'YYYY-MM-DD') as today`),
  ]);
  const today = todayRow.rows[0].today;

  return (
    <>
      <Cursor />
      <SiteNav />
      <main id="main" className="relative min-h-screen pb-24 pt-28 sm:pt-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(70%_60%_at_50%_0%,rgba(201,162,39,.10),transparent_65%)]"
        />
        <div className="relative mx-auto w-full max-w-[1300px] px-5 sm:px-8">
          <header className="mb-12 max-w-2xl">
            <p className="eyebrow">Booking</p>
            <h1 className="display mt-3 text-[clamp(2.4rem,6vw,4rem)] text-bone">Reserve your date</h1>
            <p className="mt-4 text-[14.5px] leading-relaxed text-muted">
              Six short steps. Availability and pricing come straight from the studio calendar —
              your dates are held for 24 hours once the request is submitted.
            </p>
          </header>
          <Suspense
            fallback={
              <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
                <div className="space-y-4">
                  <LoadingSkeleton className="h-10 w-full max-w-md" />
                  <LoadingSkeleton className="h-64 w-full" />
                </div>
                <LoadingSkeleton className="hidden h-80 w-full lg:block" />
              </div>
            }
          >
            <BookingFlow today={today} />
          </Suspense>
        </div>
      </main>
      <SiteFooter contact={contact} />
    </>
  );
}
