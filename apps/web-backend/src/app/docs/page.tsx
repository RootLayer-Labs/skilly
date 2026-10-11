import Link from "next/link";

export default function PublicDocsPage() {
  return (
    <main className="min-h-dvh bg-canvas px-6 py-12 text-fg">
      <div className="mx-auto max-w-3xl">
        <Link href="/login" className="text-sm font-bold text-accent-text">
          Skilly Studio
        </Link>
        <h1 className="mt-6 text-3xl font-extrabold tracking-[-0.03em]">Docs</h1>
        <p className="mt-3 text-fg-muted">
          Studio docs live inside the authenticated dashboard so they can reflect your active project, keys, allowed surfaces, and install snippet.
        </p>
        <Link
          href="/dashboard/docs"
          className="mt-6 inline-flex h-[38px] items-center rounded-[9px] bg-accent px-[13px] text-sm font-bold text-accent-fg"
        >
          Open dashboard docs
        </Link>
      </div>
    </main>
  );
}
