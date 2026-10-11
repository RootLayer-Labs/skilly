import type { ReactNode } from "react";

/*
 * v2 readiness panel (spec §5.8 readiness command panel, §4 readiness score).
 * The central "is Skilly ready?" concept on the overview. A segmented 7-step
 * progress rail (not a generic bar) + a list of checks with status icons.
 */

export type ReadinessStatus = "done" | "warning" | "pending" | "blocked";

export interface ReadinessCheck {
  id: string;
  label: string;
  status: ReadinessStatus;
  href?: string;
}

const statusIcon: Record<ReadinessStatus, { glyph: string; className: string }> = {
  done: { glyph: "✓", className: "bg-success-soft text-success border-success/25" },
  warning: { glyph: "!", className: "bg-warning-soft text-warning border-accent-line" },
  pending: { glyph: "•", className: "bg-surface text-fg-muted border-line" },
  blocked: { glyph: "×", className: "bg-danger-soft text-danger border-danger-line" },
};

/**
 * Segmented progress rail. Each segment is a thin bar; done segments fill with
 * the amber gradient. Renders exactly `total` segments (spec: 7 checks).
 */
export function ProgressSteps({ completed, total }: { completed: number; total: number }) {
  const segments = Array.from({ length: total }, (_, index) => index < completed);
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {segments.map((done, index) => (
        <span
          key={index}
          className={`h-[7px] rounded-full ${done ? "bg-[linear-gradient(90deg,var(--skilly-accent-hover),var(--skilly-accent))]" : "bg-surface-strong"}`}
        />
      ))}
    </div>
  );
}

/** A single readiness check row: status icon + label + optional trailing badge. */
export function CheckRow({ check, trailing }: { check: ReadinessCheck; trailing?: ReactNode }) {
  const icon = statusIcon[check.status];
  const inner = (
    <div className="flex items-center justify-between gap-3 rounded-[12px] border border-line-soft bg-surface px-3 py-2.5">
      <span className="flex items-center gap-2.5 text-sm text-fg-muted">
        <span
          className={`grid h-5 w-5 place-items-center rounded-full border text-[11px] font-bold ${icon.className}`}
        >
          {icon.glyph}
        </span>
        {check.label}
      </span>
      {trailing}
    </div>
  );
  return check.href ? (
    <a href={check.href} className="block transition-colors hover:bg-surface-strong">
      {inner}
    </a>
  ) : (
    inner
  );
}

/** Container for a stack of CheckRows (used by the overview + install checklist). */
export function CheckList({ children }: { children: ReactNode }) {
  return <div className="grid gap-2.5">{children}</div>;
}
