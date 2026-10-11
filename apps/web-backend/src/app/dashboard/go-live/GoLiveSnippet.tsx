"use client";

import { useActionState, useState } from "react";
import type { WidgetConfig } from "@/db/repo";
import { createKeyAction, type CreateKeyState } from "../actions";
import { Button, ButtonLink, CodeBlock } from "../v2";
import { buildFrameworkSnippets, INSTALL_FRAMEWORKS, type InstallFramework } from "./frameworkSnippets";
import { StepBadge } from "./StepBadge";

const PLACEHOLDER_KEY = "pk_live_your_key";

export function GoLiveSnippet({ skillId, widgetConfig, hasPublishableKey }: {
  skillId: string;
  widgetConfig: Pick<WidgetConfig, "accentColor" | "locale" | "launcherLabel">;
  hasPublishableKey: boolean;
}) {
  const [createState, createKey, creating] = useActionState<CreateKeyState, FormData>(createKeyAction, {});
  const [selectedFramework, setSelectedFramework] = useState<InstallFramework>("html");
  const revealedKey = createState.rawKey;
  const frameworkSnippets = buildFrameworkSnippets({ publishableKey: revealedKey ?? PLACEHOLDER_KEY, skillId, widgetConfig });
  const framework = INSTALL_FRAMEWORKS.find((candidate) => candidate.id === selectedFramework);
  const developerInstructions = `${framework?.instruction ?? ""} ${revealedKey
    ? "The publishable key is already filled in."
    : `Replace ${PLACEHOLDER_KEY} with our full publishable key.`} Reload the page on our allowed site.`;
  const developerEmailHref = `mailto:?subject=${encodeURIComponent("Add Skilly to our site")}&body=${encodeURIComponent(`${developerInstructions}\n\n${frameworkSnippets[selectedFramework]}`)}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <StepBadge step={2} />
          <h2 className="text-base font-bold text-fg">Add one line to your site</h2>
        </div>
        <a href={developerEmailHref} data-analytics-event="dashboard_go_live_email_developer_clicked"
          className="text-xs font-bold text-accent-text hover:underline">Email this to my developer</a>
      </div>
      <div role="tablist" aria-label="Install framework" className="flex gap-2">
        {INSTALL_FRAMEWORKS.map((framework) => (
          <button key={framework.id} type="button" role="tab" id={`install-tab-${framework.id}`}
            aria-controls="install-snippet" aria-selected={selectedFramework === framework.id}
            onClick={() => setSelectedFramework(framework.id)}
            className={`rounded-[8px] border px-3 py-2 text-xs font-bold transition ${selectedFramework === framework.id
              ? "border-accent-line bg-accent-soft text-accent-text"
              : "border-line-soft bg-surface text-fg-muted hover:bg-surface-strong"}`}>
            {framework.label}
          </button>
        ))}
      </div>
      <div id="install-snippet" role="tabpanel" aria-labelledby={`install-tab-${selectedFramework}`}>
        <CodeBlock language={selectedFramework === "html" ? "html" : "tsx"} label={framework?.label}
          highlight={["data-skilly-key", "data-skilly-skill", "data-skilly-backend-url", "data-skilly-core-url", "data-skilly-accent", "data-skilly-locale"]}
          code={frameworkSnippets[selectedFramework]} />
      </div>
      <p className="text-xs leading-5 text-fg-muted">
        {framework?.instruction} {revealedKey
          ? "Your real publishable key is filled in. Copy it now; the key won't be shown again. It's safe in the browser."
          : hasPublishableKey
            ? `Replace ${PLACEHOLDER_KEY} with the key you saved, or create a new one and we'll fill it in.`
            : "Create your key and we'll fill it into the script. It's safe in the browser."}
      </p>
      {createState.error && <p role="alert" className="text-sm text-danger">{createState.error}</p>}
      {!revealedKey && (
        <div className="flex flex-wrap items-center gap-3">
          <form action={createKey}>
            <input type="hidden" name="keyType" value="publishable" />
            <Button variant="secondary" analyticsEvent="dashboard_go_live_key_created_clicked"
              analyticsLabel="Create key for snippet" disabled={creating}>
              {creating ? "Creating…" : hasPublishableKey ? "Create a new key" : "Create my key"}
            </Button>
          </form>
          <ButtonLink href="/dashboard/keys" variant="ghost">Manage keys</ButtonLink>
        </div>
      )}
    </div>
  );
}
