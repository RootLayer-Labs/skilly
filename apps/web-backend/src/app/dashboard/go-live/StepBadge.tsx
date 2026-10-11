import { Check } from "lucide-react";

export function StepBadge({ step, done = false }: { step: number; done?: boolean }) {
  return (
    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${done
      ? "bg-success-soft text-success"
      : step === 2 ? "border border-accent-line text-accent-text" : "border border-line text-fg-subtle"}`}>
      {done ? <Check size={15} aria-label="Complete" /> : step}
    </span>
  );
}
