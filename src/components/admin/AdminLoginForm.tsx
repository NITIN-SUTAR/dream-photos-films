"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { BRAND_IMAGES } from "@/lib/brand";
import { Button, Input } from "@/components/ui/primitives";
import { api, ApiFailure } from "@/lib/api";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address.";
    if (password.length < 6) next.password = "Password must be at least 6 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setState("loading");
    setMessage("");
    try {
      await api.post("/api/admin/auth/login", { email, password });
      router.replace("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setState("error");
      setMessage((err as ApiFailure).message);
    }
  }

  return (
    <div className="relative grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      {/* visual side */}
      <div className="relative hidden overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND_IMAGES.adminBackdrop.src}
          alt=""
          aria-hidden
          width={BRAND_IMAGES.adminBackdrop.width}
          height={BRAND_IMAGES.adminBackdrop.height}
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/55 to-ink" />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60%_50%_at_30%_30%,rgba(201,162,39,.14),transparent_65%)]"
        />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="display text-[20px] text-bone">DREAM</span>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.3em] text-accent">
              Photo&apos;s &amp; Film&apos;s
            </span>
          </Link>
          <div>
            <p className="eyebrow">Studio management</p>
            <h2 className="display mt-4 max-w-md text-[clamp(2.2rem,3.6vw,3.4rem)] leading-[1.02] text-bone">
              Bookings, calendar, galleries — one quiet console.
            </h2>
            <p className="mt-5 max-w-sm text-[13.5px] leading-relaxed text-muted">
              Owner accounts manage the full catalogue and content. Team accounts are limited to
              bookings, calendar and clients — enforced on the server.
            </p>
          </div>
          <p className="font-mono text-[13px] uppercase tracking-[0.18em] text-muted/60">
            Designed & Developed by <b>Nitin Sutar</b>❤️
          </p>
        </div>
      </div>

      {/* form side */}
      <div className="relative flex items-center justify-center px-5 py-16 sm:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_0%,rgba(201,162,39,.08),transparent_60%)]"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass-strong relative w-full max-w-md rounded-[20px] p-7 sm:p-9"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[12px] text-muted transition-colors hover:text-bone lg:hidden"
          >
            <ArrowLeft aria-hidden className="h-3.5 w-3.5" /> Back to site
          </Link>

          <span className="mt-4 flex h-11 w-11 items-center justify-center rounded-full border border-accent/35 bg-accent/10 lg:mt-0">
            <Lock aria-hidden className="h-4.5 w-4.5 text-accent" />
          </span>
          <h1 className="display mt-5 text-[30px] text-bone">Admin access</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            Sign in to manage bookings, availability and studio content.
          </p>

          <form onSubmit={submit} noValidate className="mt-7 flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              required
              autoComplete="username"
              placeholder="example@gmail.com"
              value={email}
              error={errors.email}
              disabled={state === "loading"}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="relative">
              <Input
                label="Password"
                type={show ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                error={errors.password}
                disabled={state === "loading"}
                hint="Use the studio credentials issued to you."
                onChange={(e) => setPassword(e.target.value)}
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide password" : "Show password"}
                aria-pressed={show}
                className="absolute right-3 top-[30px] inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:text-bone"
              >
                {show ? (
                  <EyeOff aria-hidden className="h-4 w-4" />
                ) : (
                  <Eye aria-hidden className="h-4 w-4" />
                )}
              </button>
            </div>

            {state === "error" && (
              <div
                role="alert"
                className="rounded-[10px] border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-[12.5px] text-rose-100"
              >
                {message || "Those credentials were not accepted. Please try again."}
              </div>
            )}

            <Button type="submit" variant="accent" full size="lg" loading={state === "loading"}>
              {state === "loading" ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-5 flex items-start gap-2 text-[11.5px] leading-relaxed text-muted/80">
            <ShieldCheck aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent/70" />
            Sessions are issued server-side as httpOnly cookies. Roles are verified in the
            database on every request.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
