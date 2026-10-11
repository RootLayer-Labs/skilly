import Link from "next/link";

export default function PublicStatusPage() {
  return (
    <main className="min-h-dvh bg-canvas px-6 py-12 text-fg">
      <div className="mx-auto max-w-3xl">
        <Link href="/login" className="text-sm font-bold text-accent-text">
          Skilly Studio
        </Link>
        <h1 className="mt-6 text-3xl font-extrabold tracking-[-0.03em]">Status</h1>
        <p className="mt-3 text-fg-muted">
          Public status is in beta. Signed-in users can see workspace-specific configuration checks inside Studio.
        </p>
        <Link
          href="/dashboard/status"
          className="mt-6 inline-flex h-[38px] items-center rounded-[9px] bg-surface-strong px-[13px] text-sm font-bold text-fg"
        >
          Open workspace status
        </Link>
      </div>
    </main>
  );
}
