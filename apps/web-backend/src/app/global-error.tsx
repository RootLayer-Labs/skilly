"use client";

/**
 * Root error boundary (Next.js). Catches errors that the segment-level error.tsx
 * cannot — including errors in the root layout itself. Must render its own
 * <html>/<body>. Kept dependency-free so it works even if the app bundle is broken.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas font-sans text-fg antialiased">
        <main className="grid min-h-screen place-items-center px-4">
          <section className="w-full max-w-md rounded-[20px] border border-line bg-surface p-8 text-center">
            <h1 className="text-xl font-bold text-fg">Something went wrong</h1>
            <p className="mt-2 text-sm text-fg-muted">
              An unexpected error occurred. You can try again, or refresh the page.
            </p>
            {error.digest && (
              <p className="mt-3 font-mono text-xs text-fg-subtle">Reference: {error.digest}</p>
            )}
            <div className="mt-6 flex justify-center gap-2">
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-[38px] items-center rounded-[9px] border border-line bg-accent px-4 text-sm font-bold text-accent-fg transition hover:bg-accent-hover"
              >
                Try again
              </button>
              <a
                href="/dashboard"
                className="inline-flex h-[38px] items-center rounded-[9px] border border-line bg-surface px-4 text-sm font-bold text-fg transition hover:bg-surface-strong"
              >
                Go to dashboard
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
