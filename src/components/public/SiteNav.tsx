"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion, useScroll } from "framer-motion";
import { ArrowUpRight, Lock, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBodyLock, useEscape, useFocusTrap } from "@/components/ui/overlays";

const SECTIONS = [
  { id: "portfolio", label: "Portfolio" },
  { id: "films", label: "Films" },
  { id: "services", label: "Services" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const hash = (id: string) => (isHome ? `#${id}` : `/#${id}`);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  useBodyLock(menuOpen);
  useEscape(menuOpen, () => setMenuOpen(false));
  const trapRef = useFocusTrap<HTMLDivElement>(menuOpen);

  return (
    <>
      <motion.header
        initial={reduce ? false : { y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className={cn(
          "fixed inset-x-0 top-0 z-[90] transition-[background,box-shadow,border-color,padding] duration-500",
          scrolled
            ? "border-b border-white/8 bg-ink/55 py-2.5 shadow-[0_18px_50px_-30px_rgba(0,0,0,.95)] backdrop-blur-xl"
            : "border-b border-transparent py-4",
        )}
      >
        <nav
          aria-label="Primary"
          className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-6 px-5 sm:px-8"
        >
          <Link
            href="/"
            className="group flex items-baseline gap-2 whitespace-nowrap"
            aria-label="Dream Photo's & Film's — home"
          >
            <span className="display text-[17px] leading-none tracking-[0.01em] text-bone sm:text-[19px]">
              DREAM
            </span>
            <span className="font-mono text-[9.5px] uppercase leading-none tracking-[0.3em] text-accent transition-colors group-hover:text-accent-soft">
              Photo&apos;s &amp; Film&apos;s
            </span>
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={hash(s.id)}
                  aria-current={active === s.id ? "true" : undefined}
                  className={cn(
                    "relative block px-3.5 py-2 text-[13px] transition-colors duration-300",
                    active === s.id ? "text-bone" : "text-muted hover:text-bone",
                  )}
                >
                  {s.label}
                  {active === s.id && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-3 -bottom-0.5 h-px bg-accent"
                      transition={{ type: "spring", stiffness: 380, damping: 34 }}
                    />
                  )}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/login"
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] text-muted transition-colors hover:text-bone md:inline-flex"
            >
              <Lock aria-hidden className="h-3.5 w-3.5" />
              Admin
            </Link>
            <Link
              href="/booking"
              className="group hidden items-center gap-2 rounded-full bg-bone px-5 py-2.5 text-[13px] font-medium text-ink transition-all duration-300 hover:bg-white hover:shadow-[0_16px_40px_-18px_rgba(245,242,236,.7)] sm:inline-flex"
            >
              Book Now
              <ArrowUpRight
                aria-hidden
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="glass inline-flex h-10 w-10 items-center justify-center rounded-full text-bone transition-colors hover:bg-white/10 lg:hidden"
            >
              <Menu aria-hidden className="h-4 w-4" />
            </button>
          </div>
        </nav>
        <motion.div
          aria-hidden
          style={{ scaleX: scrollYProgress }}
          className="absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-accent/80 via-accent/30 to-transparent"
        />
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[110] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-ink/85 backdrop-blur-lg"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              ref={trapRef}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              tabIndex={-1}
              initial={reduce ? { opacity: 0 } : { y: "-100%" }}
              animate={reduce ? { opacity: 1 } : { y: 0 }}
              exit={reduce ? { opacity: 0 } : { y: "-100%" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="glass-strong absolute inset-x-0 top-0 flex max-h-[100dvh] flex-col overflow-y-auto rounded-b-[26px] px-6 pb-8 pt-5"
            >
              <div className="flex items-center justify-between">
                <span className="display text-[18px]">DREAM</span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-bone"
                >
                  <X aria-hidden className="h-4 w-4" />
                </button>
              </div>
              <ul className="mt-8 flex flex-col">
                {SECTIONS.map((s, i) => (
                  <motion.li
                    key={s.id}
                    initial={reduce ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 * i + 0.1, duration: 0.5 }}
                    className="border-b border-white/6"
                  >
                    <a
                      href={hash(s.id)}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-baseline justify-between py-4"
                    >
                      <span className="display text-[30px] text-bone">{s.label}</span>
                      <span className="font-mono text-[10px] text-muted">
                        0{i + 1}
                      </span>
                    </a>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col gap-3">
                <Link
                  href="/booking"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-bone text-[14px] font-medium text-ink"
                >
                  Book Now <ArrowUpRight aria-hidden className="h-4 w-4" />
                </Link>
                <Link
                  href="/admin/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-12 items-center justify-center gap-2 rounded-full border border-white/12 text-[14px] text-muted"
                >
                  <Lock aria-hidden className="h-3.5 w-3.5" /> Admin Login
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
