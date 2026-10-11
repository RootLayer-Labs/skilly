import Link from "next/link";
import { getRepo } from "@/db";
import { getBillingPlanOptions } from "@/domain/billing";
import { buildInstallSnippet } from "@/lib/installSnippet";
import { getCurrentDashboardTenantId } from "@/lib/session";
import { getWorkspaceLiveness } from "@/lib/workspaceLiveness";
import { addOriginAction, removeOriginAction } from "../actions";
import { BillingCard } from "../BillingCard";
import {
  Button,
  ButtonLink,
  CodeBlock,
  ConfirmRemoveButton,
  Field,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  StatusPill,
} from "../v2";

export const dynamic = "force-dynamic";

function originHost(origin: string | undefined): string {
  if (!origin) return "your site";
  try {
    return new URL(origin).host;
  } catch {
    return origin;
  }
}

export default async function GoLivePage() {
  const repo = getRepo();
  const tenantId = await getCurrentDashboardTenantId();
  const [keys, project, liveness, usage] = await Promise.all([
    repo.listApiKeys(tenantId),
    repo.ensureDefaultProject(tenantId),
    getWorkspaceLiveness(repo, tenantId),
    repo.getUsageSummary(tenantId),
  ]);
  const publishableKey = keys.find((key) => key.keyType === "publishable" && !key.revoked);
  const installSnippet = buildInstallSnippet({
    publishableKey: "pk_live_your_key",
    skillId: project.skillId,
    widgetConfig: project.widgetConfig,
  });
  const developerEmailHref = `mailto:?subject=${encodeURIComponent("Add Skilly to our site")}&body=${encodeURIComponent(
    `Replace pk_live_your_key with our full publishable key, paste this script before the closing body tag on our allowed site, and reload the page.\n\n${installSnippet}`,
  )}`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="For builders · Go live"
        title="Put Skilly on your site."
        action={<StatusPill tone={liveness.isLive ? "green" : "amber"} label={`${liveness.stepsCompleted}/${liveness.stepsTotal}`} />}
      />

      <Panel>
        <PanelHeader title="Your site" />
        <PanelBody>
          {project.allowedOrigins.length ? (
            <ul className="divide-y divide-line-soft">
              {project.allowedOrigins.map((origin) => (
                <li key={origin} className="flex items-center justify-between gap-4 py-2.5">
                  <span className="break-all font-mono text-[13px] text-fg-muted">{origin}</span>
                  <ConfirmRemoveButton
                    action={removeOriginAction}
                    hiddenFieldName="origin"
                    hiddenFieldValue={origin}
                    triggerLabel="Remove"
                    title="Remove this origin?"
                    body={`Widget sessions from ${origin} will be rejected once it is removed.`}
                    confirmLabel="Remove origin"
                    analyticsEvent="dashboard_origin_removed"
                    analyticsLabel={origin}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-fg-muted">No web origins configured yet.</p>
          )}
          <form action={addOriginAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Field name="origin" label="Origin" placeholder="https://app.acme.com" helper="Include the protocol." />
            <Button variant="secondary">Add domain</Button>
          </form>
          <Link href="/dashboard/origins" className="mt-4 inline-block text-xs text-fg-muted underline hover:text-fg">
            Adding a mobile app?
          </Link>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader title="Add one script tag" description="Paste before the closing body tag. The publishable key is safe in the browser." />
        <PanelBody>
          <CodeBlock
            language="html"
            label="HTML"
            highlight={["data-skilly-key", "data-skilly-skill", "data-skilly-backend-url", "data-skilly-core-url", "data-skilly-accent", "data-skilly-locale"]}
            code={installSnippet}
          />
          <p className="mt-3 text-sm text-fg-muted">
            {publishableKey
              ? "Your publishable key was shown once when created. Replace pk_live_your_key with the full key you saved, or create a new key."
              : "Create a publishable key, then replace pk_live_your_key with the full key shown when it is created."}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <ButtonLink href="/dashboard/keys" variant="secondary">Create a key</ButtonLink>
            <a
              href={developerEmailHref}
              data-analytics-event="dashboard_go_live_email_developer_clicked"
              className="text-sm font-bold text-accent-text underline"
            >
              Email this to my developer
            </a>
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader title="Status" />
        <PanelBody>
          {liveness.isLive ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-fg">Skilly is live on {liveness.installedOrigin}.</p>
              <StatusPill tone="green" label="Live" showDot />
            </div>
          ) : liveness.isInstalled ? (
            <p className="text-sm text-fg-muted">
              Installed on {liveness.installedOrigin}. Open your site and ask Skilly one question.
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-fg-muted">Waiting for Skilly on {originHost(project.allowedOrigins[0])}…</p>
              <a
                href="/dashboard/go-live"
                data-analytics-event="dashboard_go_live_check_again_clicked"
                className="text-sm font-bold text-accent-text underline"
              >
                Check again
              </a>
            </div>
          )}
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader title={liveness.isInstalled ? "Pick a plan to keep Skilly on" : "Pick a plan when you're ready (you can go live first)"} />
        <PanelBody>
          <BillingCard capSeconds={usage.capSeconds} plans={getBillingPlanOptions(process.env)} />
        </PanelBody>
      </Panel>
    </div>
  );
}
