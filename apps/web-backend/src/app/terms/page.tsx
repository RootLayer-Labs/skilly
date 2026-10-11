import Link from "next/link";

export default function PublicTermsPage() {
  return (
    <main className="min-h-dvh bg-canvas px-6 py-12 text-fg">
      <div className="mx-auto max-w-3xl">
        <Link href="/login" className="text-sm font-bold text-accent-text">
          Skilly Studio
        </Link>
        <h1 className="mt-6 text-3xl font-extrabold tracking-[-0.03em]">Terms</h1>
        <div className="mt-5 space-y-4 text-sm leading-relaxed text-fg-muted">
          <p>Skilly Studio is currently in beta. Use the dashboard to configure projects, install widgets, and test behavior before sending production traffic.</p>
          <p>Formal customer terms should replace this beta notice before the public launch.</p>
        </div>
      </div>
    </main>
  );
}
