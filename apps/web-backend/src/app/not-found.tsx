import Link from "next/link";
import { CursorGlyph, LogoMark } from "./dashboard/v2";

/**
 * Root 404 (Next.js). Shown for any unmatched route. Calm, branded, with a clear
 * path home — not the default Next "404 | This page could not be found."
 */
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4">
      <section className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex justify-center">
          <LogoMark size={40} />
        </div>
        <div className="mx-auto mb-5 flex justify-center">
          <CursorGlyph size={48} />
        </div>
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-fg">Page not found</h1>
        <p className="mt-2 text-sm text-fg-muted">
          We couldn&apos;t find what you were looking for. It may have moved or never existed.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex h-[38px] items-center rounded-[9px] border border-line bg-accent px-4 text-sm font-bold text-accent-fg transition hover:bg-accent-hover"
          >
            Go to dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex h-[38px] items-center rounded-[9px] border border-line bg-surface px-4 text-sm font-bold text-fg transition hover:bg-surface-strong"
          >
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
