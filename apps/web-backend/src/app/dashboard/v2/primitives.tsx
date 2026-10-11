import Link from "next/link";
import type { ReactNode } from "react";

/*
 * Skilly Web v2 core primitives. Source of truth:
 * skilly_web_v2_component_contracts.md + skilly_web_v2_tokens.css.
 * Amber is the single accent (spec §1 color usage rule): primary CTAs, active
 * nav, focus rings only — never every border or every icon.
 */

/** Tailwind class strings shared across button surfaces. */
const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-[9px] h-[38px] px-[13px] text-sm font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

const buttonVariants = {
  // The one main action per screen. Amber fill, dark text, soft amber shadow.
  primary:
    "bg-accent text-accent-fg border border-line shadow-card hover:bg-accent-hover",
  // Secondary actions. Translucent surface, light text.
  secondary: "bg-surface text-fg border border-line hover:bg-surface-strong",
  // Tertiary/low-emphasis. Transparent, muted text, surface fill on hover.
  ghost: "bg-transparent text-fg-muted border border-transparent hover:bg-surface-strong hover:text-fg",
  // Revoke/remove/delete only. Red-tinted.
  danger:
    "bg-danger-soft text-danger border border-danger-line hover:bg-danger-soft/80",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;

/** Submit button (for use inside <form action={serverAction}>) or a clickable button (onClick). */
export function Button({
  children,
  variant = "secondary",
  disabled,
  type = "submit",
  className,
  analyticsEvent,
  analyticsLabel,
  onClick,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  disabled?: boolean;
  type?: "submit" | "button";
  className?: string;
  analyticsEvent?: string;
  analyticsLabel?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      data-analytics-event={analyticsEvent}
      data-analytics-label={analyticsLabel}
      className={`${buttonBase} ${buttonVariants[variant]} ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

/** Link styled as a button (navigation, not form submission). */
export function ButtonLink({
  href,
  children,
  variant = "secondary",
  className,
  analyticsEvent,
  analyticsLabel,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  analyticsEvent?: string;
  analyticsLabel?: string;
}) {
  return (
    <Link
      href={href}
      data-analytics-event={analyticsEvent}
      data-analytics-label={analyticsLabel}
      data-analytics-target={href}
      className={`${buttonBase} ${buttonVariants[variant]} ${className ?? ""}`}
    >
      {children}
    </Link>
  );
}

/** Status pill with an optional colored dot. Color is never the only signal — pair with a label. */
export function StatusPill({
  tone = "neutral",
  label,
  showDot = false,
  className,
}: {
  tone?: "neutral" | "amber" | "green" | "red";
  label: ReactNode;
  showDot?: boolean;
  className?: string;
}) {
  const dotTone = {
    neutral: "bg-fg-subtle",
    amber: "bg-accent shadow-card",
    green: "bg-success shadow-card",
    red: "bg-danger shadow-card",
  } as const;

  const pillTone = {
    neutral: "border-line bg-surface text-fg-muted",
    amber: "border-accent-line bg-accent-soft text-accent-text",
    green: "border-success/25 bg-success-soft text-success",
    red: "border-danger-line bg-danger-soft text-danger",
  } as const;

  return (
    <span
      className={`inline-flex h-[26px] items-center gap-[7px] rounded-full border px-[9px] text-xs font-semibold ${pillTone[tone]} ${className ?? ""}`}
    >
      {showDot && <span className={`h-[7px] w-[7px] rounded-full ${dotTone[tone]}`} />}
      {label}
    </span>
  );
}

/** Eyebrow badge above page titles (e.g. the "Overview" chip). Renders uppercase. */
export function Eyebrow({ children, tone = "amber" }: { children: ReactNode; tone?: "amber" | "neutral" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-[9px] py-0.5 text-xs font-semibold uppercase tracking-wide ${tone === "neutral" ? "border-line bg-surface text-fg-muted" : "border-accent-line bg-accent-soft text-accent-text"}`}
    >
      {children}
    </span>
  );
}

/**
 * Canonical page header: eyebrow + 24px/700 title + muted subtitle + optional action.
 * Every dashboard page starts with this so the header scale is identical (spec §1 type).
 */
export function PageHeader({
  eyebrow,
  eyebrowTone = "amber",
  title,
  description,
  action,
}: {
  eyebrow: string;
  eyebrowTone?: "amber" | "neutral";
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-[18px]">
      <div>
        <Eyebrow tone={eyebrowTone}>{eyebrow}</Eyebrow>
        <h1 className="mt-3 text-2xl font-bold leading-tight tracking-[-0.035em] text-fg">{title}</h1>
        {description && <p className="mt-[7px] max-w-[690px] text-sm leading-relaxed text-fg-muted">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-[10px]">{action}</div>}
    </header>
  );
}

/**
 * Panel — the v2 replacement for "card". Spec §3: use panels, not noisy cards.
 * Main panels and elevated panels share a border; elevation is a slightly
 * stronger surface gradient.
 */
export function Panel({
  children,
  className,
  elevated = false,
  id,
}: {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`min-w-0 rounded-[16px] border border-line shadow-card ${elevated ? "bg-surface-strong" : "bg-surface"} ${className ?? ""}`}
    >
      {children}
    </section>
  );
}

/** Panel header band (title + subtitle + optional action), separated by a soft border. */
export function PanelHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-[14px] border-b border-line-soft px-[18px] py-[17px]">
      <div>
        <div className="text-[15px] font-bold tracking-[-0.01em] text-fg">{title}</div>
        {description && <div className="mt-[3px] text-[13px] text-fg-muted">{description}</div>}
      </div>
      {action}
    </div>
  );
}

/** Panel body padding. */
export function PanelBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`p-[18px] ${className ?? ""}`}>{children}</div>;
}

/** Section sub-title inside a panel body. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="text-[15px] font-bold tracking-[-0.01em] text-fg">{children}</div>;
}
