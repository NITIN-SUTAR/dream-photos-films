import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteNav } from "@/components/public/SiteNav";
import { SiteFooter } from "@/components/public/Closing";
import { BookingStatusView } from "@/components/booking/BookingStatusView";
import { LoadingSkeleton } from "@/components/ui/primitives";
import { getStudioContact } from "@/server/repositories";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Booking status",
  description: "Track the status of your booking request with Dream Photo's & Film's.",
  robots: { index: false, follow: false },
};

export default async function BookingStatusPage({
  params,
}: {
  params: Promise<{ bookingNumber: string }>;
}) {
  const [{ bookingNumber }, contact] = await Promise.all([params, getStudioContact()]);
  return (
    <>
      <SiteNav />
      <main id="main" className="relative min-h-screen pb-24 pt-28 sm:pt-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[460px] bg-[radial-gradient(70%_60%_at_50%_0%,rgba(201,162,39,.09),transparent_65%)]"
        />
        <div className="relative mx-auto w-full max-w-[1100px] px-5 sm:px-8">
          <Suspense fallback={<LoadingSkeleton className="h-64 w-full" />}>
            <BookingStatusView bookingNumber={bookingNumber} />
          </Suspense>
        </div>
      </main>
      <SiteFooter contact={contact} />
    </>
  );
}
