import type { ReactNode } from "react";

/*
 * v2 metric tile (spec §5.8 usage strip, prototype .metric). Compact label +
 * big tracked value + muted foot. Used in horizontal metric strips on the
 * overview and usage pages.
 */
export function Metric({
  label,
  value,
  foot,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  foot?: ReactNode;
  tone?: "neutral" | "amber" | "green" | "red";
}) {
  const valueTone = {
    neutral: "text-fg",
    amber: "text-accent-text",
    green: "text-success",
    red: "text-danger",
  } as const;

  return (
    <div className="rounded-[14px] border border-line-soft bg-surface p-4">
      <div className="text-xs font-bold tracking-[0.02em] text-fg-muted">{label}</div>
      <div className={`mt-1.5 text-2xl font-extrabold tracking-[-0.045em] ${valueTone[tone]}`}>{value}</div>
      {foot && <div className="mt-1 text-xs text-fg-subtle">{foot}</div>}
    </div>
  );
}
