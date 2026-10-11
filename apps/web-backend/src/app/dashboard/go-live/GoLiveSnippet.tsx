"use client";

import { useActionState } from "react";
import type { WidgetConfig } from "@/db/repo";
import { buildInstallSnippet } from "@/lib/installSnippet";
import { createKeyAction, type CreateKeyState } from "../actions";
import { Button, ButtonLink, CodeBlock } from "../v2";

const PLACEHOLDER_KEY = "pk_live_your_key";

/**
 * The Go live script tag. Raw keys are stored hashed, so an existing key can't
 * be shown again; instead the builder can mint a fresh publishable key here and
 * get a snippet (and developer email) with the real key filled in, once.
 */
export function GoLiveSnippet({
  skillId,
  widgetConfig,
  hasPublishableKey,
}: {
  skillId: string;
  widgetConfig: Pick<WidgetConfig, "accentColor" | "locale" | "launcherLabel">;
  hasPublishableKey: boolean;
}) {
  const [createState, createKey, creating] = useActionState<CreateKeyState, FormData>(createKeyAction, {});
  const revealedKey = createState.rawKey;
  const installSnippet = buildInstallSnippet({ publishableKey: revealedKey ?? PLACEHOLDER_KEY, skillId, widgetConfig });
  const developerInstructions = revealedKey
    ? "Paste this script before the closing body tag on our allowed site, then reload the page."
    : `Replace ${PLACEHOLDER_KEY} with our full publishable key, paste this script before the closing body tag on our allowed site, and reload the page.`;
  const developerEmailHref = `mailto:?subject=${encodeURIComponent("Add Skilly to our site")}&body=${encodeURIComponent(
    `${developerInstructions}\n\n${installSnippet}`,
  )}`;

  return (
    <>
      <CodeBlock
        language="html"
        label="HTML"
        highlight={["data-skilly-key", "data-skilly-skill", "data-skilly-backend-url", "data-skilly-core-url", "data-skilly-accent", "data-skilly-locale"]}
        code={installSnippet}
      />
      {revealedKey ? (
        <p className="mt-3 text-sm font-bold text-accent-text">
          Your new key is filled in. Copy the script now — the key won&apos;t be shown again.
        </p>
      ) : (
        <p className="mt-3 text-sm text-fg-muted">
          {hasPublishableKey
            ? `Replace ${PLACEHOLDER_KEY} with the key you saved, or create a new one and we'll fill it in.`
            : "Create your key and we'll fill it into the script."}
        </p>
      )}
      {createState.error && <p className="mt-3 text-sm text-danger">{createState.error}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        {!revealedKey && (
          <form action={createKey}>
            <input type="hidden" name="keyType" value="publishable" />
            <Button
              variant={hasPublishableKey ? "secondary" : "primary"}
              analyticsEvent="dashboard_go_live_key_created_clicked"
              analyticsLabel="Create key for snippet"
              disabled={creating}
            >
              {creating ? "Creating…" : hasPublishableKey ? "Create a new key" : "Create my key"}
            </Button>
          </form>
        )}
        <a
          href={developerEmailHref}
          data-analytics-event="dashboard_go_live_email_developer_clicked"
          className="text-sm font-bold text-accent-text underline"
        >
          Email this to my developer
        </a>
        <ButtonLink href="/dashboard/keys" variant="ghost">Manage keys</ButtonLink>
      </div>
    </>
  );
}
