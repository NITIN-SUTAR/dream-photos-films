"use client";

import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Check, Loader2, type LucideIcon } from "lucide-react";
import { cn, STATUS_STYLES } from "@/lib/utils";
import type { BookingStatus } from "@/lib/types";

/* ------------------------------- Button -------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type ButtonSize = "sm" | "md" | "lg";

const BUTTON_BASE =
  "relative inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-[transform,background-color,border-color,color,box-shadow] duration-300 ease-[cubic-bezier(.16,1,.3,1)] disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98] select-none";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-bone text-ink hover:bg-white shadow-[0_18px_40px_-24px_rgba(245,242,236,.9)]",
  accent:
    "bg-accent/95 text-ink hover:bg-accent shadow-[0_18px_44px_-22px_rgba(201,162,39,.85)]",
  secondary:
    "glass text-bone hover:border-[rgba(245,242,236,.28)] hover:bg-white/[0.07]",
  ghost: "text-muted hover:text-bone hover:bg-white/[0.05]",
  danger: "border border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[12.5px]",
  md: "h-11 px-6 text-[13.5px]",
  lg: "h-13 px-8 text-[15px]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  full?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    icon: Icon,
    iconRight: IconRight,
    loading = false,
    full,
    className,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        BUTTON_BASE,
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        full && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
      ) : (
        Icon && <Icon aria-hidden className="h-4 w-4 shrink-0" />
      )}
      <span className="truncate">{children}</span>
      {IconRight && !loading && (
        <IconRight
          aria-hidden
          className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover/btn:translate-x-0.5"
        />
      )}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: LucideIcon;
  variant?: "glass" | "ghost" | "solid";
  size?: "sm" | "md" | "lg";
}

export function IconButton({
  label,
  icon: Icon,
  variant = "glass",
  size = "md",
  className,
  ...rest
}: IconButtonProps) {
  const sizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12" };
  const variants = {
    glass: "glass text-bone hover:bg-white/10",
    ghost: "text-muted hover:text-bone hover:bg-white/[0.06]",
    solid: "bg-bone text-ink hover:bg-white",
  };
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-all duration-300 active:scale-95 disabled:pointer-events-none disabled:opacity-40",
        sizes[size],
        variants[variant],
        className,
      )}
      {...rest}
    >
      <Icon aria-hidden className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </button>
  );
}

/* ------------------------------- Fields -------------------------------- */

const FIELD_BASE =
  "w-full rounded-[10px] border bg-white/[0.035] px-3.5 py-2.5 text-[14px] text-bone placeholder:text-white/25 transition-all duration-200 hover:border-white/20 focus:border-accent/60 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-50";

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  success?: string;
  required?: boolean;
  id: string;
  children: ReactNode;
  className?: string;
}

export function FieldShell({
  label,
  hint,
  error,
  success,
  required,
  id,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted"
      >
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </label>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-center gap-1.5 text-[12px] text-rose-300"
        >
          <AlertTriangle aria-hidden className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : success ? (
        <p className="flex items-center gap-1.5 text-[12px] text-emerald-300">
          <Check aria-hidden className="h-3.5 w-3.5 shrink-0" />
          {success}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[12px] text-muted/80">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  success?: string;
  wrapClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, success, className, wrapClassName, id, ...rest },
  ref,
) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      success={success}
      required={rest.required}
      className={wrapClassName}
    >
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(
          FIELD_BASE,
          error ? "border-rose-400/50" : success ? "border-emerald-400/40" : "border-white/10",
          className,
        )}
        {...rest}
      />
    </FieldShell>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, ...rest },
  ref,
) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={rest.required}>
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(
          FIELD_BASE,
          "min-h-28 resize-y leading-relaxed",
          error ? "border-rose-400/50" : "border-white/10",
          className,
        )}
        {...rest}
      />
    </FieldShell>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, placeholder, className, id, ...rest },
  ref,
) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={rest.required}>
      <select
        ref={ref}
        id={fieldId}
        aria-invalid={!!error}
        className={cn(
          FIELD_BASE,
          "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23a7a4a0%22 stroke-width=%221.5%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:18px] bg-[right_12px_center] bg-no-repeat pr-10",
          error ? "border-rose-400/50" : "border-white/10",
          className,
        )}
        {...rest}
      >
        {placeholder && (
          <option value="" className="bg-ink-2">
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-ink-2">
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
});

export function Checkbox({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "group flex cursor-pointer items-start gap-3 rounded-[10px] border border-white/8 bg-white/[0.02] p-3 transition-all duration-200 hover:border-white/18",
        checked && "border-accent/45 bg-accent/[0.07]",
        disabled && "pointer-events-none opacity-45",
      )}
    >
      <span className="relative mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer absolute h-4 w-4 cursor-pointer opacity-0"
        />
        <span
          aria-hidden
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-[5px] border transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-accent/60",
            checked ? "border-accent bg-accent text-ink" : "border-white/25",
          )}
        >
          {checked && <Check className="h-3 w-3" strokeWidth={3} />}
        </span>
      </span>
      <span className="min-w-0">
        <span className="block text-[13.5px] text-bone">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[12px] leading-relaxed text-muted">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

export function RadioRow({
  name,
  label,
  description,
  value,
  checked,
  onChange,
  trailing,
}: {
  name: string;
  label: string;
  description?: string;
  value: string;
  checked: boolean;
  onChange: (v: string) => void;
  trailing?: ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-[12px] border p-4 transition-all duration-300",
        checked
          ? "border-accent/50 bg-accent/[0.07] shadow-[0_0_0_1px_rgba(201,162,39,.16)]"
          : "border-white/8 bg-white/[0.02] hover:border-white/20",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent/60",
          checked ? "border-accent" : "border-white/25",
        )}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-accent" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] text-bone">{label}</span>
        {description && <span className="block text-[12px] text-muted">{description}</span>}
      </span>
      {trailing}
    </label>
  );
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
  id,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
}) {
  const auto = useId();
  const tid = id ?? auto;
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <label htmlFor={tid} className="block cursor-pointer text-[13.5px] text-bone">
          {label}
        </label>
        {description && (
          <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{description}</p>
        )}
      </div>
      <button
        id={tid}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-300",
          checked ? "border-accent/60 bg-accent/30" : "border-white/12 bg-white/[0.05]",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)]",
            checked ? "left-6 bg-accent" : "left-1 bg-white/55",
          )}
        />
      </button>
    </div>
  );
}

/* ------------------------------ Surfaces ------------------------------- */

export function Card({
  children,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <As className={cn("rounded-[16px] panel p-5", className)}>{children}</As>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
  className?: string;
}) {
  const tones = {
    neutral: "border-white/12 bg-white/[0.05] text-muted",
    accent: "border-accent/35 bg-accent/10 text-accent-soft",
    success: "border-emerald-300/30 bg-emerald-400/10 text-emerald-200",
    warning: "border-amber-300/30 bg-amber-400/10 text-amber-200",
    danger: "border-rose-300/30 bg-rose-400/10 text-rose-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusIndicator({
  status,
  size = "md",
}: {
  status: BookingStatus;
  size?: "sm" | "md";
}) {
  const styles = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-mono uppercase tracking-[0.14em]",
        styles.chip,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-[11px]",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
      {styles.label}
    </span>
  );
}

export function SectionHeader({
  index,
  eyebrow,
  title,
  description,
  align = "left",
  actions,
  className,
  level = 2,
}: {
  index?: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  actions?: ReactNode;
  className?: string;
  level?: 1 | 2 | 3;
}) {
  const Heading = `h${level}` as "h1" | "h2" | "h3";
  return (
    <div
      className={cn(
        "flex flex-col gap-5 md:flex-row md:items-end md:justify-between",
        align === "center" && "md:flex-col md:items-center md:text-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
        {(index || eyebrow) && (
          <div
            className={cn(
              "mb-4 flex items-center gap-3",
              align === "center" && "justify-center",
            )}
          >
            {index && <span className="font-mono text-[11px] text-accent">{index}</span>}
            <span aria-hidden className="h-px w-8 bg-gradient-to-r from-accent/70 to-transparent" />
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          </div>
        )}
        <Heading className="display text-[clamp(2rem,5vw,3.6rem)] text-bone">{title}</Heading>
        {description && (
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ------------------------------- States -------------------------------- */

export function LoadingSkeleton({
  className,
  rounded = "rounded-[12px]",
}: {
  className?: string;
  rounded?: string;
}) {
  return <div aria-hidden className={cn("skeleton", rounded, className)} />;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[16px] border border-dashed border-white/10 bg-white/[0.015] px-6 py-14 text-center",
        className,
      )}
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
        <Icon aria-hidden className="h-5 w-5 text-muted" />
      </span>
      <h3 className="text-[15px] text-bone">{title}</h3>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-3 rounded-[16px] border border-rose-400/25 bg-rose-500/[0.07] p-5",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <AlertTriangle aria-hidden className="h-4 w-4 text-rose-300" />
        <h3 className="text-[14px] text-rose-100">{title}</h3>
      </div>
      <p className="text-[13px] leading-relaxed text-rose-100/70">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/* ------------------------------ Motion --------------------------------- */

export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ---------------------------- Image frame ------------------------------ */

export interface ImageFrameProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  ratio?: string;
  overlay?: boolean;
  children?: ReactNode;
}

export function ImageFrame({
  src,
  alt,
  width,
  height,
  sizes,
  className,
  imgClassName,
  priority = false,
  ratio,
  overlay = true,
  children,
}: ImageFrameProps) {
  return (
    <div
      className={cn("relative overflow-hidden bg-ink-3", className)}
      style={ratio ? { aspectRatio: ratio } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        className={cn("h-full w-full object-cover", imgClassName)}
      />
      {overlay && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/5 to-transparent"
        />
      )}
      {children}
    </div>
  );
}
