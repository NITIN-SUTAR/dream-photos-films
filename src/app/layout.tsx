import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/overlays";

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DREAM PHOTO'S & FILM'S — Cinematic Photography & Filmmaking Studio",
    template: "%s · DREAM PHOTO'S & FILM'S",
  },
  description:
    "A photography and filmmaking studio working across Maharashtra and Gujarat. Weddings, pre-weddings, events, portraits and short cinematic films.",
  openGraph: {
    title: "DREAM PHOTO'S & FILM'S",
    description:
      "Cinematic photography and filmmaking. Weddings, pre-weddings, events, portraits and short films.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#07070a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="bg-ink text-bone antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-full focus:bg-bone focus:px-5 focus:py-2.5 focus:text-[13px] focus:text-ink"
        >
          Skip to content
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
