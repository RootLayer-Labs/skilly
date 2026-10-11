import type { ReactNode } from "react";

export function GuideHeader({ action }: { action: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-[18px]">
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent-text">Step 1 of 3 · Your guide</p>
        <h1 className="mt-3 text-[30px] font-bold leading-tight tracking-[-0.035em] text-fg">Here's the guide Skilly follows.</h1>
        <p className="mt-2 max-w-[690px] text-sm leading-relaxed text-fg-muted">Check what Skilly will say and point at. Plain language, no markdown needed.</p>
      </div>
      {action}
    </header>
  );
}
