"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { InstagramIcon, YoutubeIcon } from "@/components/ui/BrandIcons";
import { TrackBooking } from "@/components/public/TrackBooking";
import { BRAND_IMAGES } from "@/lib/brand";
import { api, ApiFailure } from "@/lib/api";

export interface StudioContact {
  studioName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  instagram: string;
  youtube: string;
  facebook: string;
}
import { Input, Reveal, Textarea, Button } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/overlays";

export function BookingCta({ contact }: { contact: StudioContact }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", reduce ? "-8%" : "8%"]);

  return (
    <section
      ref={ref}
      aria-labelledby="cta-title"
      className="relative isolate overflow-hidden py-28 sm:py-36"
    >
      <motion.div style={{ y }} className="absolute inset-0 -z-20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND_IMAGES.ctaBackdrop.src}
          alt=""
          aria-hidden
          width={BRAND_IMAGES.ctaBackdrop.width}
          height={BRAND_IMAGES.ctaBackdrop.height}
          loading="lazy"
          className="h-[118%] w-full object-cover opacity-40"
        />
      </motion.div>
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-ink via-ink/78 to-ink" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_50%,rgba(201,162,39,.12),transparent_65%)]"
      />

      <div className="relative mx-auto w-full max-w-4xl px-5 text-center sm:px-8">
        <Reveal>
          <p className="eyebrow">Dates are held first-come</p>
          <h2
            id="cta-title"
            className="display mt-5 text-[clamp(2.4rem,7vw,5rem)] leading-[0.95] text-bone"
          >
            Let&apos;s make something
            <br />
            <em className="not-italic text-accent/90">worth keeping.</em>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-muted">
            Send us the date, the city and what the day means to you. We will come back with
            availability, a shot plan and a clear estimate — usually within a day.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/booking"
              className="group inline-flex h-13 items-center gap-2.5 rounded-full bg-bone px-8 text-[14.5px] font-medium text-ink transition-all duration-500 hover:shadow-[0_24px_60px_-24px_rgba(245,242,236,.9)]"
            >
              Book Now
              <ArrowUpRight
                aria-hidden
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
            <a
              href={`tel:${contact.phone.replace(/\s/g, "")}`}
              className="inline-flex h-13 items-center gap-2.5 rounded-full glass px-8 text-[14.5px] text-bone transition-colors hover:bg-white/[0.08]"
            >
              <Phone aria-hidden className="h-4 w-4" />
              Direct Contact
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Contact({ contact }: { contact: StudioContact }) {
  const { push } = useToast();
  const [state, setState] = useState<"idle" | "submitting" | "success">("idle");
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!values.name.trim()) next.name = "Please tell us your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      next.email = "Enter a valid email address.";
    if (values.message.trim().length < 10)
      next.message = "A sentence or two helps us reply properly.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setState("submitting");
    try {
      await api.post("/api/public/contact", values);
      setState("success");
      push({
        tone: "success",
        title: "Message received",
        description: "The studio has your enquiry and will reply shortly.",
      });
    } catch (err) {
      setState("idle");
      push({
        tone: "error",
        title: "We could not send that",
        description: (err as ApiFailure).message,
      });
    }
  }

  return (
    <section id="contact" aria-labelledby="contact-title" className="relative py-24 sm:py-32">
      <div className="mx-auto w-full max-w-[1500px] px-5 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Reveal>
              <div className="mb-5 flex items-center gap-3">
                <span className="font-mono text-[11px] text-accent">10</span>
                <span aria-hidden className="h-px w-8 bg-gradient-to-r from-accent/70 to-transparent" />
                <span className="eyebrow">Contact</span>
              </div>
              <h2 id="contact-title" className="display text-[clamp(2rem,5vw,3.6rem)] text-bone">
                Talk to the studio
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
                We answer calls between 10am and 8pm IST. For date availability, the booking
                flow is the fastest route.
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <ul className="mt-10 divide-y divide-white/8 border-y border-white/8">
                {[
                  {
                    icon: Phone,
                    label: "Phone",
                    value: contact.phone,
                    href: `tel:${contact.phone.replace(/\s/g, "")}`,
                  },
                  {
                    icon: MessageCircle,
                    label: "WhatsApp",
                    value: contact.whatsapp,
                    href: `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`,
                  },
                  {
                    icon: Mail,
                    label: "Email",
                    value: contact.email,
                    href: `mailto:${contact.email}`,
                  },
                  {
                    icon: InstagramIcon,
                    label: "Instagram",
                    value: "@dreamphotosfilms",
                    href: contact.instagram,
                  },
                  {
                    icon: MapPin,
                    label: "Studio",
                    value: `${contact.address}, ${contact.city}`,
                  },
                ].map((row) => (
                  <li key={row.label}>
                    {row.href ? (
                      <a
                        href={row.href}
                        className="group flex items-center gap-4 py-4 transition-colors"
                      >
                        <row.icon aria-hidden className="h-4 w-4 shrink-0 text-accent" />
                        <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                          {row.label}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[14.5px] text-bone transition-transform duration-300 group-hover:translate-x-0.5">
                          {row.value}
                        </span>
                        <ArrowUpRight
                          aria-hidden
                          className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                        />
                      </a>
                    ) : (
                      <div className="flex items-center gap-4 py-4">
                        <row.icon aria-hidden className="h-4 w-4 shrink-0 text-accent" />
                        <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                          {row.label}
                        </span>
                        <span className="min-w-0 flex-1 text-[14.5px] text-bone">{row.value}</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal delay={0.12}>
            <form
              onSubmit={submit}
              noValidate
              aria-label="Send a message to the studio"
              className="glass rounded-[16px] p-5 sm:p-7"
            >
              <p className="eyebrow">Quick message</p>
              <p className="display mt-2 text-[22px] text-bone">Tell us about the day</p>

              <div className="mt-6 flex flex-col gap-4">
                <Input
                  label="Your name"
                  required
                  value={values.name}
                  error={errors.name}
                  disabled={state !== "idle"}
                  onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                />
                <Input
                  label="Email"
                  type="email"
                  required
                  value={values.email}
                  error={errors.email}
                  disabled={state !== "idle"}
                  onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                />
                <Textarea
                  label="What are we shooting?"
                  required
                  value={values.message}
                  error={errors.message}
                  disabled={state !== "idle"}
                  hint="Dates, city, and the kind of coverage you have in mind."
                  onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
                />
              </div>

              {state === "success" ? (
                <div
                  role="status"
                  className="mt-6 rounded-[12px] border border-emerald-300/30 bg-emerald-400/10 p-4 text-[13px] text-emerald-100"
                >
                  Thank you — your enquiry has reached the studio. We usually reply within a day.
                </div>
              ) : (
                <Button
                  type="submit"
                  variant="accent"
                  full
                  className="mt-6"
                  icon={Send}
                  loading={state === "submitting"}
                >
                  {state === "submitting" ? "Sending…" : "Send message"}
                </Button>
              )}
              <p className="mt-3 text-center text-[11px] text-muted/70">
                Prefer the phone? Call {contact.phone}.
              </p>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter({ contact }: { contact: StudioContact }) {
  return (
    <footer className="relative border-t border-white/8 bg-ink-2/60">
      <div className="mx-auto w-full max-w-[1500px] px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="display text-[22px] text-bone">DREAM</span>
              <span className="font-mono text-[9.5px] uppercase tracking-[0.3em] text-accent">
                Photo&apos;s &amp; Film&apos;s
              </span>
            </div>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-muted">
              A photography and filmmaking studio working across Maharashtra and Gujarat.
              Weddings, pre-weddings, events, portraits and short cinema — shot, graded and
              delivered in-house.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { icon: InstagramIcon, href: contact.instagram, label: "Instagram" },
                { icon: YoutubeIcon, href: contact.youtube, label: "YouTube" },
                { icon: MessageCircle, href: `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`, label: "WhatsApp" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="glass inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:text-bone"
                >
                  <s.icon aria-hidden className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
            <TrackBooking />
          </div>

          <nav aria-label="Footer — explore">
            <h2 className="eyebrow">Explore</h2>
            <ul className="mt-4 space-y-2.5">
              {[
                { label: "Portfolio", href: "/#portfolio" },
                { label: "Films", href: "/#films" },
                { label: "Raw vs Edited", href: "/#raw-vs-edited" },
                { label: "Virtual Light Lab", href: "/#light-lab" },
                { label: "About", href: "/#about" },
                { label: "Client Gallery", href: "/gallery" },
              ].map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-[13px] text-muted transition-colors hover:text-bone"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Footer — services">
            <h2 className="eyebrow">Services</h2>
            <ul className="mt-4 space-y-2.5">
              {[
                "Wedding Photography & Films",
                "Pre-Wedding Photography",
                "Event Photography",
                "Portrait Photography",
                "Short Cinematic Films",
                "Photo Albums",
              ].map((l) => (
                <li key={l}>
                  <Link
                    href="/#services"
                    className="text-[13px] text-muted transition-colors hover:text-bone"
                  >
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="eyebrow">Direct Contact</h2>
            <ul className="mt-4 space-y-2.5 text-[13px] text-muted">
              <li>
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="hover:text-bone">
                  {contact.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${contact.email}`} className="break-all hover:text-bone">
                  {contact.email}
                </a>
              </li>
              <li className="leading-relaxed">
                {contact.address}
                <br />
                {contact.city}
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-bone">
                  Admin Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/8 pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted/70">
            © {new Date().getFullYear()} Dream Photo&apos;s &amp; Film&apos;s. All rights reserved.
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted/70">
            Designed &amp; developed by{" "}
            <span className="text-accent/80">Studio Frontend Team</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
