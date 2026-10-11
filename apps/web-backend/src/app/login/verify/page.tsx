import { LogoMark } from "../../dashboard/v2";

export const dynamic = "force-dynamic";

export default async function VerifyLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; intent?: string; next?: string }>;
}) {
  const params = await searchParams;
  const isSignup = params.intent === "signup";
  const nextPath = params.next?.startsWith("/dashboard") ? params.next : "/dashboard";
  const error = params.error;
  const errorMessage =
    error === "magic_code"
      ? "That code did not work. Check the email and try again."
      : error === "magic_expired"
        ? "The email code expired. Start again with your email."
        : error === "no_membership"
          ? "Your WorkOS account is not mapped to a Skilly tenant yet."
          : null;

  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(circle_at_50%_-20%,var(--skilly-accent-soft),transparent_34%),linear-gradient(var(--skilly-canvas),var(--skilly-canvas))] px-4 text-fg">
      <section className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-overlay">
        <div className="mb-6 flex items-center gap-3">
          <LogoMark size={40} />
          <div>
            <h1 className="text-2xl font-extrabold tracking-[-0.035em]">Check your email</h1>
            <p className="text-sm text-fg-subtle">Enter the six-digit WorkOS code to continue.</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-danger-line bg-danger-soft p-3 text-sm text-danger">
            {errorMessage}
          </div>
        )}

        <form action="/api/auth/workos/magic/verify" method="post" className="grid gap-4">
          <input type="hidden" name="next" value={nextPath} />
          {isSignup && <input type="hidden" name="intent" value="signup" />}
          <label className="grid gap-1.5">
            <span className="text-sm font-bold text-fg-muted">Code</span>
            <input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              className="rounded-lg border border-line-strong bg-surface-sunken px-3 py-2.5 text-center font-mono text-lg tracking-[0.24em] text-fg outline-none transition focus:border-accent-line"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-accent px-4 py-2.5 text-sm font-bold text-accent-fg transition hover:bg-accent-hover active:scale-[0.98]"
          >
            Continue
          </button>
        </form>

        <a
          href={`${isSignup ? "/signup" : "/login"}?next=${encodeURIComponent(nextPath)}`}
          className="mt-5 block text-center text-sm font-bold text-fg-muted transition hover:text-fg"
        >
          Use a different email
        </a>
      </section>
    </main>
  );
}
