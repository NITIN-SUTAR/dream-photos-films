"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, IconButton } from "./primitives";

/* --------------------------- scroll + focus ---------------------------- */

export function useBodyLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    const prevPad = document.body.style.paddingRight;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;
    return () => {
      document.body.style.overflow = prev;
      document.body.style.paddingRight = prevPad;
    };
  }, [active]);
}

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusables = node.querySelectorAll<HTMLElement>(FOCUSABLE);
    (focusables[0] ?? node).focus({ preventScroll: true });

    function onKey(e: KeyboardEvent) {
      if (e.key !== "Tab" || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.({ preventScroll: true });
    };
  }, [active]);
  return ref;
}

export function useEscape(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onEscape();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, onEscape]);
}

/* ------------------------------- Dialog -------------------------------- */

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: DialogProps) {
  const reduce = useReducedMotion();
  const trapRef = useFocusTrap<HTMLDivElement>(open);
  const titleId = useId();
  useBodyLock(open);
  useEscape(open, onClose);

  const widths = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-ink/80 backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.985 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "glass-strong relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[22px] sm:rounded-[20px]",
              widths[size],
            )}
          >
            <header className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 id={titleId} className="display text-[22px] text-bone">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{description}</p>
                )}
              </div>
              <IconButton label="Close dialog" icon={X} variant="ghost" size="sm" onClick={onClose} />
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
            {footer && (
              <footer className="flex items-center justify-end gap-2 border-t border-white/8 bg-white/[0.02] px-5 py-4 sm:px-6">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  tone = "default",
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: "default" | "danger";
  loading?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "accent"}
            size="sm"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-[13.5px] leading-relaxed text-muted">{message}</p>
    </Dialog>
  );
}

/* ------------------------------- Drawer -------------------------------- */

export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "left" | "right";
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const trapRef = useFocusTrap<HTMLDivElement>(open);
  const titleId = useId();
  useBodyLock(open);
  useEscape(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]">
          <motion.div
            className="absolute inset-0 bg-ink/78 backdrop-blur-[5px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={reduce ? { opacity: 0 } : { x: side === "right" ? "100%" : "-100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: side === "right" ? "100%" : "-100%" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "glass-strong absolute top-0 flex h-full w-[min(26rem,92vw)] flex-col",
              side === "right" ? "right-0" : "left-0",
              className,
            )}
          >
            <header className="flex items-center justify-between gap-4 border-b border-white/8 px-5 py-4">
              <h2 id={titleId} className="display text-[20px] text-bone">
                {title}
              </h2>
              <IconButton label="Close panel" icon={X} variant="ghost" size="sm" onClick={onClose} />
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer && (
              <footer className="border-t border-white/8 bg-white/[0.02] px-5 py-4">{footer}</footer>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------- Tabs --------------------------------- */

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
  size = "md",
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  const groupId = useId();
  return (
    <div
      role="tablist"
      aria-label="View"
      className={cn(
        "inline-flex flex-wrap items-center gap-1 rounded-full glass p-1",
        className,
      )}
    >
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              "relative rounded-full transition-colors duration-300",
              size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-4 py-2 text-[13px]",
              active ? "text-ink" : "text-muted hover:text-bone",
            )}
          >
            {active && (
              <motion.span
                layoutId={`tab-${groupId}`}
                className="absolute inset-0 rounded-full bg-bone"
                transition={{ type: "spring", stiffness: 420, damping: 38 }}
              />
            )}
            <span className="relative z-10 whitespace-nowrap">
              {t.label}
              {typeof t.count === "number" && (
                <span className={cn("ml-1.5 font-mono text-[10px]", active ? "text-ink/60" : "text-muted/70")}>
                  {t.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------ Dropdown ------------------------------- */

export function Dropdown({
  trigger,
  items,
  align = "right",
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  items: { label: string; onSelect: () => void; danger?: boolean; icon?: ReactNode }[];
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  useEscape(open, () => setOpen(false));
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "glass-strong absolute z-50 mt-2 min-w-48 overflow-hidden rounded-[12px] p-1",
              align === "right" ? "right-0" : "left-0",
            )}
          >
            {items.map((item) => (
              <button
                key={item.label}
                role="menuitem"
                type="button"
                onClick={() => {
                  item.onSelect();
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-left text-[13px] transition-colors",
                  item.danger
                    ? "text-rose-200 hover:bg-rose-500/12"
                    : "text-muted hover:bg-white/[0.06] hover:text-bone",
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------- Tooltip ------------------------------- */

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-50 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md border border-white/10 bg-ink-2/95 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted opacity-0 shadow-lg backdrop-blur transition-all duration-200 group-hover/tt:translate-y-0 group-hover/tt:opacity-100 group-focus-within/tt:translate-y-0 group-focus-within/tt:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}

/* -------------------------------- Toast -------------------------------- */

type ToastTone = "success" | "error" | "info";
interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

const ToastCtx = createContext<{
  push: (t: Omit<ToastItem, "id">) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((t: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.random();
    setItems((cur) => [...cur, { ...t, id }]);
    setTimeout(() => setItems((cur) => cur.filter((i) => i.id !== id)), 4200);
  }, []);
  const value = useMemo(() => ({ push }), [push]);

  const icons = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
  } as const;

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {items.map((t) => {
            const Icon = icons[t.tone];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.97 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="glass-strong pointer-events-auto flex items-start gap-3 rounded-[12px] p-3.5"
              >
                <Icon
                  aria-hidden
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    t.tone === "success" && "text-emerald-300",
                    t.tone === "error" && "text-rose-300",
                    t.tone === "info" && "text-accent",
                  )}
                />
                <div className="min-w-0">
                  <p className="text-[13px] text-bone">{t.title}</p>
                  {t.description && (
                    <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                      {t.description}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  return (
    ctx ?? {
      push: () => {
        /* no provider — noop */
      },
    }
  );
}

export { AlertTriangle };
