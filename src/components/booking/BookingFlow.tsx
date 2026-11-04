"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronUp,
  CircleAlert,
  Copy,
  Pencil,
  Sparkles,
} from "lucide-react";
import { BUDGET_BANDS, DISTRICTS } from "@/lib/brand";
import { cn, formatDate, formatINR } from "@/lib/utils";
import {
  api,
  ApiFailure,
  useApi,
  type BookingQuote,
  type ExtraDTO,
  type PackageDTO,
  type ServiceDTO,
} from "@/lib/api";
import { Button, Input, LoadingSkeleton, RadioRow, Select, StatusIndicator, Textarea } from "@/components/ui/primitives";
import { ErrorState } from "@/components/ui/primitives";
import { Calendar, useAvailability, type CalendarMode } from "./Calendar";
import { useToast } from "@/components/ui/overlays";

const STEPS = [
  { id: 1, code: "01", label: "Service" },
  { id: 2, code: "02", label: "Package" },
  { id: 3, code: "03", label: "Date" },
  { id: 4, code: "04", label: "Extras" },
  { id: 5, code: "05", label: "Details" },
  { id: 6, code: "06", label: "Review" },
] as const;

interface ClientDetails {
  name: string;
  state: string;
  district: string;
  city: string;
  phone: string;
  email: string;
  notes: string;
}

const EMPTY_DETAILS: ClientDetails = {
  name: "",
  state: "",
  district: "",
  city: "",
  phone: "",
  email: "",
  notes: "",
};

type SubmitState = "idle" | "submitting" | "failure";

interface CatalogResponse {
  services: ServiceDTO[];
  packages: PackageDTO[];
  extras: ExtraDTO[];
}

interface CreatedBooking {
  bookingNumber: string;
  status: string;
  serviceName: string;
  packageName: string | null;
  packageOption: string | null;
  dates: string[];
  extras: { id: string; name: string; price: number }[];
  baseAmount: number;
  extrasAmount: number;
  estimate: number;
  statusUrl: string;
  expiresAt: string | null;
}

export function BookingFlow({ today }: { today: string }) {
  const params = useSearchParams();
  const reduce = useReducedMotion();
  const { push } = useToast();
  const { data: catalog, loading: catalogLoading, error: catalogError, refetch } =
    useApi<CatalogResponse>("/api/public/catalog");
  const { availability, loading: availLoading, load, reset } = useAvailability();

  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState(params.get("service") ?? "");
  const [packageId, setPackageId] = useState(params.get("package") ?? "");
  const [album, setAlbum] = useState(params.get("album") !== "0");
  const [mode, setMode] = useState<CalendarMode>("single");
  const [dates, setDates] = useState<string[]>([]);
  const [extras, setExtras] = useState<string[]>(
    params.get("extras")?.split(",").filter(Boolean) ?? [],
  );
  const [details, setDetails] = useState<ClientDetails>(EMPTY_DETAILS);
  const [errors, setErrors] = useState<Partial<Record<keyof ClientDetails, string>>>({});
  const [submit, setSubmit] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState<string>("");
  const [created, setCreated] = useState<CreatedBooking | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const idempotencyKey = useRef<string>("");
  useEffect(() => {
    if (!idempotencyKey.current) {
      idempotencyKey.current = `booking-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
  }, []);

  const services = catalog?.services ?? [];
  const service = services.find((s) => s.id === serviceId) ?? null;
  const isWedding = service?.name?.toLowerCase().startsWith("wedding");
  const servicePackages = useMemo(
    () => (catalog?.packages ?? []).filter((p) => p.serviceId === serviceId),
    [catalog, serviceId],
  );
  const selectedPackageId = servicePackages.some((p) => p.id === packageId) ? packageId : "";
  const pkg = servicePackages.find((p) => p.id === selectedPackageId) ?? null;
  const availableExtras = useMemo(
    () => (catalog?.extras ?? []).filter((e) => !serviceId || e.serviceIds.includes(serviceId)),
    [catalog, serviceId],
  );
  const extrasList = availableExtras.filter((e) => extras.includes(e.id));

  /* ---- server-authoritative quote ---- */
  const refreshQuote = useCallback(async () => {
    if (!serviceId) return setQuote(null);
    try {
      const q = await api.post<BookingQuote>("/api/public/quote", {
        serviceId,
        packageId: selectedPackageId || null,
        album,
        extras,
        dates,
      });
      setQuote(q);
    } catch {
      setQuote(null);
    }
  }, [serviceId, selectedPackageId, album, extras, dates]);

  useEffect(() => {
    const t = setTimeout(refreshQuote, 180);
    return () => clearTimeout(t);
  }, [refreshQuote]);

  const total = quote?.total ?? 0;
  const baseAmount = quote?.baseAmount ?? 0;
  const extrasAmount = quote?.extrasAmount ?? 0;

  const canAdvance: Record<number, boolean> = {
    1: !!serviceId,
    2: servicePackages.length === 0 || !!selectedPackageId,
    3: dates.length > 0,
    4: true,
    5: true,
    6: true,
  };

  function validateDetails() {
    const next: Partial<Record<keyof ClientDetails, string>> = {};
    if (details.name.trim().length < 2) next.name = "Please enter your full name.";
    if (!/^[+\d][\d\s-]{7,}$/.test(details.phone.trim())) next.phone = "Enter a reachable phone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) next.email = "Enter a valid email address.";
    if (!details.state) next.state = "Choose your state.";
    if (!details.district) next.district = "Choose the district closest to the venue.";
    if (details.city.trim().length < 2) next.city = "Add the city or venue location.";
    if (isWedding && dates.length !== 3) next.city = next.city || "Select exactly 3 wedding dates.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goto(next: number) {
    if (next > step) {
      if (next > 5 && !validateDetails()) {
        setStep(5);
        return;
      }
      if (!canAdvance[step]) return;
    }
    setStep(Math.min(6, Math.max(1, next)));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    if (!validateDetails()) {
      setStep(5);
      push({ tone: "error", title: "Check your details", description: "Some fields need attention." });
      return;
    }
    setSubmit("submitting");
    setSubmitError("");
    try {
      const result = await api.post<CreatedBooking>(
        "/api/public/bookings",
        {
          serviceId,
          packageId: selectedPackageId || null,
          album,
          extras,
          dates,
          notes: details.notes,
          client: {
            name: details.name,
            email: details.email,
            phone: details.phone,
            state: details.state,
            district: details.district,
            city: details.city,
          },
        },
        { "idempotency-key": idempotencyKey.current },
      );
      setCreated(result);
      idempotencyKey.current = `booking-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      reset();
      push({
        tone: "success",
        title: "Request submitted",
        description: `Reference ${result.bookingNumber} — the studio will review it shortly.`,
      });
    } catch (err) {
      const e = err as ApiFailure;
      setSubmit("failure");
      setSubmitError(e.message);
      if (e.code === "DATE_UNAVAILABLE" || e.code === "BOOKING_CONFLICT") {
        reset();
        setDates([]);
        setStep(3);
      }
      push({ tone: "error", title: "We could not submit that", description: e.message });
    }
  }

  /* ------------------------------ success ----------------------------- */
  if (created) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl py-16 text-center"
      >
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-accent/40 bg-accent/10">
          <BadgeCheck aria-hidden className="h-7 w-7 text-accent" />
        </span>
        <h1 className="display mt-7 text-[clamp(2rem,5vw,3.2rem)] text-bone">Request submitted</h1>
        <p className="mt-4 text-[14.5px] leading-relaxed text-muted">
          Your booking reference is <span className="font-mono text-accent">{created.bookingNumber}</span>.
          The studio reviews requests within 24 hours and will confirm availability before anything
          is locked. Your dates are held until then.
        </p>
        <div className="glass mx-auto mt-8 max-w-md rounded-[14px] p-5 text-left">
          <dl className="space-y-2.5 text-[13px]">
            <Row label="Service" value={created.serviceName} />
            {created.packageName && <Row label="Package" value={created.packageName} />}
            <Row label="Album" value={created.packageOption ?? "—"} />
            <Row
              label={created.dates.length > 1 ? "Dates" : "Date"}
              value={created.dates.map((d) => formatDate(d, "short")).join(" · ")}
            />
            <Row label="Extras" value={created.extras.length ? `${created.extras.length} selected` : "None"} />
            <div className="flex items-center justify-between border-t border-white/8 pt-3">
              <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">Estimate</dt>
              <dd className="display text-[24px]">{formatINR(created.estimate)}</dd>
            </div>
          </dl>
        </div>
        <div className="mx-auto mt-5 flex max-w-md items-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.03] p-3">
          <p className="min-w-0 flex-1 truncate text-left font-mono text-[11px] text-muted">
            {created.statusUrl}
          </p>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(`${window.location.origin}${created.statusUrl}`);
              push({ tone: "info", title: "Private link copied" });
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-[11.5px] text-bone"
          >
            <Copy aria-hidden className="h-3 w-3" /> Copy
          </button>
        </div>
        <p className="mx-auto mt-3 max-w-md text-[12px] leading-relaxed text-muted/70">
          Keep this private link — it is the only way to open your booking status page.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={created.statusUrl}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-bone px-7 text-[14px] font-medium text-ink"
          >
            Track this request <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
          <Link href="/" className="inline-flex h-12 items-center gap-2 rounded-full glass px-7 text-[14px] text-bone">
            Back to the studio
          </Link>
        </div>
      </motion.div>
    );
  }

  if (catalogError) {
    return (
      <ErrorState
        title="We could not load the studio catalogue"
        description={catalogError.message}
        onRetry={refetch}
      />
    );
  }

  if (catalogLoading || !catalog) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <LoadingSkeleton className="h-10 w-full max-w-md" />
          <LoadingSkeleton className="h-64 w-full" />
          <LoadingSkeleton className="h-40 w-full" />
        </div>
        <LoadingSkeleton className="hidden h-80 w-full lg:block" />
      </div>
    );
  }

  const summary = (
    <div className="flex flex-col gap-4">
      <div>
        <p className="eyebrow">Your booking</p>
        <p className="display mt-1.5 text-[22px] text-bone">
          {service ? service.name : "Nothing selected yet"}
        </p>
      </div>
      <dl className="space-y-2.5 border-t border-white/8 pt-4 text-[13px]">
        <Row label="Package" value={pkg ? `${pkg.code} — ${pkg.name}` : "—"} />
        <Row label="Album" value={pkg ? (album ? "With album" : "Without album") : "—"} />
        <Row
          label={dates.length > 1 ? "Dates" : "Date"}
          value={
            dates.length
              ? dates.length > 2
                ? `${formatDate(dates[0], "short")} → ${formatDate(dates[dates.length - 1], "short")}`
                : dates.map((d) => formatDate(d, "short")).join(" · ")
              : "—"
          }
        />
        <Row label="Days" value={String(dates.length || 0)} />
        <Row label="Extras" value={extrasList.length ? String(extrasList.length) : "None"} />
      </dl>
      <dl className="space-y-2 border-t border-white/8 pt-4 text-[13px]">
        <div className="flex justify-between">
          <dt className="text-muted">Base amount</dt>
          <dd className="text-bone">{formatINR(baseAmount)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Extras amount</dt>
          <dd className="text-bone">{formatINR(extrasAmount)}</dd>
        </div>
        <div className="flex items-end justify-between border-t border-white/8 pt-3">
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">Estimate</dt>
          <dd className="display text-[28px] text-bone">{formatINR(total)}</dd>
        </div>
      </dl>
      <p className="text-[11px] leading-relaxed text-muted/75">
        This <strong className="text-muted">estimate</strong> is calculated by the studio server
        from live catalogue pricing. It is not a confirmed booking or a payment.
      </p>
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
      <div>
        <ol className="mb-10 flex flex-wrap items-center gap-x-1 gap-y-2" aria-label="Booking progress">
          {STEPS.map((s) => {
            const done = s.id < step;
            const current = s.id === step;
            return (
              <li key={s.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => s.id < step && goto(s.id)}
                  disabled={s.id > step}
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "group flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors duration-300",
                    current ? "text-bone" : done ? "text-muted hover:text-bone" : "text-muted/40",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border font-mono text-[9px] transition-colors",
                      current
                        ? "border-accent bg-accent text-ink"
                        : done
                          ? "border-accent/40 text-accent"
                          : "border-white/12",
                    )}
                  >
                    {done ? <Check className="h-3 w-3" strokeWidth={3} /> : s.code}
                  </span>
                  <span className="text-[12.5px]">{s.label}</span>
                </button>
                {s.id !== 6 && <span aria-hidden className="mx-0.5 hidden h-px w-4 bg-white/10 sm:block" />}
              </li>
            );
          })}
        </ol>

        <AnimatePresence mode="wait">
          <motion.section
            key={step}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 1 && (
              <StepShell
                title="What are we shooting?"
                caption="Step 01 — Service"
                description="Choose the coverage you need. You can refine everything later in the conversation."
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {services.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setServiceId(s.id);
                        setPackageId("");
                        if (s.name.toLowerCase().startsWith("wedding")) setMode("range");
                      }}
                      aria-pressed={serviceId === s.id}
                      className={cn(
                        "group rounded-[14px] border p-4 text-left transition-all duration-400",
                        serviceId === s.id
                          ? "border-accent/50 bg-accent/[0.08]"
                          : "border-white/8 bg-white/[0.02] hover:-translate-y-0.5 hover:border-white/20",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-[15px] text-bone">{s.name}</h3>
                        <span
                          aria-hidden
                          className={cn(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                            serviceId === s.id ? "border-accent bg-accent text-ink" : "border-white/15",
                          )}
                        >
                          {serviceId === s.id && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                      </div>
                      <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{s.description}</p>
                      <p className="mt-3 font-mono text-[11px] text-accent">
                        from {formatINR(s.price)} <span className="text-muted">· {s.priceNote}</span>
                      </p>
                    </button>
                  ))}
                </div>
              </StepShell>
            )}

            {step === 2 && (
              <StepShell
                title={servicePackages.length ? "Choose a package" : "No packages needed"}
                caption="Step 02 — Package"
                description={
                  servicePackages.length
                    ? "Each package can be booked with or without a hand-bound album."
                    : "This service is quoted directly — continue to pick your dates."
                }
              >
                {servicePackages.length === 0 ? (
                  <div className="rounded-[14px] border border-white/8 bg-white/[0.02] p-6">
                    <p className="text-[13.5px] text-muted">
                      {service?.name} is quoted from the base price of{" "}
                      <span className="text-bone">{formatINR(service?.price ?? 0)}</span>. Extras can be
                      added in the next steps.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-3 md:grid-cols-3">
                      {servicePackages.map((p) => {
                        const active = packageId === p.id;
                        const price =
                          p.options.find((o) => o.kind === (album ? "WITH_ALBUM" : "WITHOUT_ALBUM"))
                            ?.price ?? 0;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setPackageId(p.id)}
                            aria-pressed={active}
                            className={cn(
                              "flex h-full flex-col rounded-[14px] border p-4 text-left transition-all duration-400",
                              active
                                ? "border-accent/50 bg-gradient-to-b from-accent/[0.1] to-transparent"
                                : "border-white/8 bg-white/[0.02] hover:-translate-y-0.5 hover:border-white/20",
                            )}
                          >
                            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
                              {p.code}
                            </span>
                            <h3 className="display mt-2 text-[22px] text-bone">{p.name}</h3>
                            <ul className="mt-3 flex-1 space-y-1.5 border-t border-white/8 pt-3">
                              {p.inclusions.map((inc) => (
                                <li key={inc} className="flex items-start gap-2 text-[12.5px] text-bone/85">
                                  <Check aria-hidden className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                                  {inc}
                                </li>
                              ))}
                            </ul>
                            <p className="mt-4 display text-[22px] text-bone">{formatINR(price)}</p>
                          </button>
                        );
                      })}
                    </div>
                    <fieldset className="mt-6">
                      <legend className="eyebrow mb-3">Album option</legend>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <RadioRow
                          name="album"
                          value="with"
                          label="With album"
                          description="Hand-bound layflat album, designed in-studio."
                          checked={album}
                          onChange={() => setAlbum(true)}
                          trailing={
                            pkg && (
                              <span className="font-mono text-[11px] text-accent">
                                {formatINR(pkg.options.find((o) => o.kind === "WITH_ALBUM")?.price ?? 0)}
                              </span>
                            )
                          }
                        />
                        <RadioRow
                          name="album"
                          value="without"
                          label="Without album"
                          description="Digital deliverables only."
                          checked={!album}
                          onChange={() => setAlbum(false)}
                          trailing={
                            pkg && (
                              <span className="font-mono text-[11px] text-muted">
                                {formatINR(pkg.options.find((o) => o.kind === "WITHOUT_ALBUM")?.price ?? 0)}
                              </span>
                            )
                          }
                        />
                      </div>
                    </fieldset>
                  </>
                )}
              </StepShell>
            )}

            {step === 3 && (
              <StepShell
                title="Pick your dates"
                caption="Step 03 — Date"
                description="Availability is read live from the studio calendar. Booked, held and blocked dates cannot be selected."
              >
                <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
                  {(
                    [
                      { id: "single", label: "Single day" },
                      { id: "range", label: "Date range" },
                      { id: "multi", label: "Multiple days" },
                    ] as { id: CalendarMode; label: string }[]
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setMode(m.id);
                        setDates([]);
                      }}
                      aria-pressed={mode === m.id}
                      className={cn(
                        "relative rounded-full px-4 py-2 text-[12.5px] transition-colors duration-300",
                        mode === m.id ? "text-ink" : "text-muted hover:text-bone",
                      )}
                    >
                      {mode === m.id && (
                        <motion.span
                          layoutId="date-mode"
                          className="absolute inset-0 rounded-full bg-bone"
                          transition={{ type: "spring", stiffness: 420, damping: 36 }}
                        />
                      )}
                      <span className="relative z-10">{m.label}</span>
                    </button>
                  ))}
                </div>
                <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
                  <div className="glass rounded-[16px] p-4 sm:p-5">
                    <Calendar
                      mode={mode}
                      selected={dates}
                      onSelect={setDates}
                      availability={availability}
                      today={today}
                      loading={availLoading}
                      onMonthChange={load}
                      maxSelectable={isWedding ? 3 : 5}
                    />
                  </div>
                  <div className="rounded-[14px] border border-white/8 bg-white/[0.02] p-4">
                    <p className="eyebrow">Selected</p>
                    {dates.length === 0 ? (
                      <p className="mt-3 text-[13px] text-muted">
                        No dates yet. Pick at least one available day.
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {dates.map((d) => (
                          <li
                            key={d}
                            className="flex items-center gap-2 rounded-[8px] border border-accent/25 bg-accent/[0.07] px-3 py-2 text-[12.5px] text-bone"
                          >
                            <CalendarDays aria-hidden className="h-3.5 w-3.5 text-accent" />
                            {formatDate(d)}
                          </li>
                        ))}
                      </ul>
                    )}
                    {mode !== "single" && (
                      <p className="mt-4 text-[11.5px] leading-relaxed text-muted/80">
                        Up to 5 days can be requested in one booking.
                      </p>
                    )}
                  </div>
                </div>
              </StepShell>
            )}

            {step === 4 && (
              <StepShell
                title="Add extras"
                caption="Step 04 — Extras"
                description="Optional additions priced by the studio. Everything here can also be added later."
              >
                {["Albums", "Digital Deliverables", "Additional Services"].map((group) => {
                  const items = availableExtras.filter((e) => e.group === group);
                  if (!items.length) return null;
                  return (
                    <div key={group} className="mb-7">
                      <p className="eyebrow mb-3">{group}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {items.map((e) => {
                          const on = extras.includes(e.id);
                          return (
                            <button
                              key={e.id}
                              type="button"
                              aria-pressed={on}
                              onClick={() =>
                                setExtras((cur) =>
                                  cur.includes(e.id) ? cur.filter((x) => x !== e.id) : [...cur, e.id],
                                )
                              }
                              className={cn(
                                "flex items-start gap-3 rounded-[12px] border p-3.5 text-left transition-all duration-300",
                                on
                                  ? "border-accent/50 bg-accent/[0.08]"
                                  : "border-white/8 bg-white/[0.02] hover:border-white/20",
                              )}
                            >
                              <span
                                aria-hidden
                                className={cn(
                                  "mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[5px] border transition-colors",
                                  on ? "border-accent bg-accent text-ink" : "border-white/20",
                                )}
                              >
                                {on && <Check className="h-3 w-3" strokeWidth={3} />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-baseline justify-between gap-3">
                                  <span className="text-[13.5px] text-bone">{e.name}</span>
                                  <span
                                    className={cn(
                                      "shrink-0 font-mono text-[11px]",
                                      on ? "text-accent" : "text-muted",
                                    )}
                                  >
                                    +{formatINR(e.price)}
                                  </span>
                                </span>
                                <span className="mt-1 block text-[12px] leading-relaxed text-muted">
                                  {e.description}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </StepShell>
            )}

            {step === 5 && (
              <StepShell
                title="Your details"
                caption="Step 05 — Details"
                description="We use this only to reply about your booking."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Full name"
                    required
                    value={details.name}
                    error={errors.name}
                    autoComplete="name"
                    onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))}
                  />
                  <Input
                    label="Phone"
                    required
                    type="tel"
                    inputMode="tel"
                    placeholder="+91 "
                    value={details.phone}
                    error={errors.phone}
                    autoComplete="tel"
                    onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))}
                  />
                  <Input
                    label="Email"
                    required
                    type="email"
                    value={details.email}
                    error={errors.email}
                    autoComplete="email"
                    onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))}
                  />
                  <Select
                    label="State"
                    required
                    placeholder="Select a state"
                    value={details.state}
                    error={errors.state}
                    options={[
                      { value: "Maharashtra", label: "Maharashtra" },
                      { value: "Gujarat", label: "Gujarat" },
                    ]}
                    onChange={(e) => setDetails((d) => ({ ...d, state: e.target.value, district: "", city: "" }))}
                  />
                  <Select
                    label="District (Maharashtra / Gujarat)"
                    required
                    placeholder="Select a district"
                    value={details.district}
                    error={errors.district}
                    disabled={!details.state}
                    options={(details.state === "Maharashtra"
                      ? DISTRICTS.slice(0, 36)
                      : details.state === "Gujarat"
                        ? DISTRICTS.slice(36)
                        : []
                    ).map((d) => ({ value: d, label: d }))}
                    onChange={(e) => setDetails((d) => ({ ...d, district: e.target.value }))}
                  />
                  <Input
                    label="City / venue location"
                    required
                    value={details.city}
                    error={errors.city}
                    onChange={(e) => setDetails((d) => ({ ...d, city: e.target.value }))}
                  />
                  <Input
                    label="Event date"
                    readOnly
                    disabled
                    value={dates.length ? dates.map((d) => formatDate(d, "short")).join(" · ") : "Select in step 03"}
                    hint="Edit this in the Date step."
                  />
                  <div className="sm:col-span-2">
                    <Textarea
                      label="Your vision / notes"
                      value={details.notes}
                      hint="Venue, rituals, family size, references — anything that helps us plan."
                      onChange={(e) => setDetails((d) => ({ ...d, notes: e.target.value }))}
                    />
                  </div>
                </div>
              </StepShell>
            )}

            {step === 6 && (
              <StepShell
                title="Review your request"
                caption="Step 06 — Review"
                description="Check everything below. You can jump back to any step to make changes."
              >
                <div className="space-y-3">
                  <ReviewBlock title="Service & package" onEdit={() => setStep(1)}>
                    <Row label="Service" value={service?.name ?? "—"} />
                    <Row label="Package" value={pkg ? `${pkg.code} — ${pkg.name}` : "—"} />
                    <Row label="Album" value={pkg ? (album ? "With album" : "Without album") : "—"} />
                  </ReviewBlock>
                  <ReviewBlock title="Dates" onEdit={() => setStep(3)}>
                    <Row
                      label={dates.length > 1 ? "Selected dates" : "Selected date"}
                      value={dates.map((d) => formatDate(d, "short")).join(" · ") || "—"}
                    />
                    <Row label="Total days" value={String(dates.length)} />
                  </ReviewBlock>
                  <ReviewBlock title="Extras" onEdit={() => setStep(4)}>
                    {extrasList.length === 0 ? (
                      <p className="text-[13px] text-muted">No extras selected.</p>
                    ) : (
                      extrasList.map((e) => <Row key={e.id} label={e.name} value={formatINR(e.price)} />)
                    )}
                  </ReviewBlock>
                  <ReviewBlock title="Your details" onEdit={() => setStep(5)}>
                    <Row label="Name" value={details.name || "—"} />
                    <Row label="Phone" value={details.phone || "—"} />
                    <Row label="Email" value={details.email || "—"} />
                    <Row label="District" value={details.district || "—"} />
                    <Row label="City" value={details.city || "—"} />
                    <Row label="Notes" value={details.notes || "—"} />
                  </ReviewBlock>
                  <div className="rounded-[14px] border border-accent/30 bg-accent/[0.06] p-5">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">Estimate</p>
                      <StatusIndicator status="PENDING" size="sm" />
                    </div>
                    <p className="display mt-2 text-[38px] text-bone">{formatINR(total)}</p>
                    <p className="mt-2 text-[12px] leading-relaxed text-muted">
                      Base {formatINR(baseAmount)} + extras {formatINR(extrasAmount)}, calculated by the
                      studio server. This is an estimate — not a confirmed booking and not a payment.
                    </p>
                  </div>

                  {submit === "failure" && (
                    <div role="alert" className="flex items-start gap-3 rounded-[12px] border border-rose-400/30 bg-rose-500/10 p-4">
                      <CircleAlert aria-hidden className="mt-0.5 h-4 w-4 text-rose-300" />
                      <div>
                        <p className="text-[13.5px] text-rose-100">We could not submit that</p>
                        <p className="mt-1 text-[12.5px] text-rose-100/70">{submitError}</p>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="accent"
                    size="lg"
                    full
                    icon={Sparkles}
                    loading={submit === "submitting"}
                    onClick={handleSubmit}
                  >
                    {submit === "submitting" ? "Submitting request…" : "Submit booking request"}
                  </Button>
                </div>
              </StepShell>
            )}
          </motion.section>
        </AnimatePresence>

        <div className="mt-10 flex items-center justify-between gap-3 border-t border-white/8 pt-6">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => goto(step - 1)} disabled={step === 1}>
            Back
          </Button>
          {step < 6 && (
            <Button
              variant="primary"
              iconRight={ArrowRight}
              className="group/btn"
              onClick={() => goto(step + 1)}
              disabled={!canAdvance[step]}
            >
              Continue
            </Button>
          )}
        </div>
      </div>

      <aside aria-label="Booking summary" className="glass sticky top-28 hidden rounded-[16px] p-5 lg:block">
        {summary}
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <AnimatePresence>
          {summaryOpen && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="glass-strong max-h-[60vh] overflow-y-auto rounded-t-[20px] p-5"
            >
              {summary}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={() => setSummaryOpen((v) => !v)}
          aria-expanded={summaryOpen}
          className="flex w-full items-center justify-between gap-4 border-t border-white/10 bg-ink/92 px-5 py-3.5 backdrop-blur-xl"
        >
          <span className="text-left">
            <span className="block font-mono text-[9.5px] uppercase tracking-[0.18em] text-accent">Estimate</span>
            <span className="display text-[22px] text-bone">{formatINR(total)}</span>
          </span>
          <span className="flex items-center gap-2 text-[12.5px] text-muted">
            {summaryOpen ? "Hide" : "Summary"}
            <ChevronUp
              aria-hidden
              className={cn("h-4 w-4 transition-transform duration-300", summaryOpen && "rotate-180")}
            />
          </span>
        </button>
      </div>
      <div aria-hidden className="h-20 lg:hidden" />
    </div>
  );
}

function StepShell({
  title,
  caption,
  description,
  children,
}: {
  title: string;
  caption: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="eyebrow">{caption}</p>
      <h2 className="display mt-2 text-[clamp(1.8rem,4vw,2.6rem)] text-bone">{title}</h2>
      <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-muted">{description}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function ReviewBlock({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[14px] border border-white/8 bg-white/[0.02] p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 text-[12px] text-accent transition-colors hover:text-accent-soft"
        >
          <Pencil aria-hidden className="h-3 w-3" /> Edit
        </button>
      </div>
      <dl className="space-y-2">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <dt className="shrink-0 text-[12.5px] text-muted">{label}</dt>
      <dd className="text-right text-[12.5px] text-bone">{value}</dd>
    </div>
  );
}
