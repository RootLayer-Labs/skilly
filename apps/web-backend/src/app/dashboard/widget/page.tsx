import { getRepo } from "@/db";
import { parseStudioGuide } from "@/domain/studioGuide";
import { getCurrentDashboardTenantId } from "@/lib/session";
import { ButtonLink, Panel, PanelBody, StatusPill } from "../v2";
import { CustomerWebsitePreview, StudioAssistantPreview } from "./DashboardWidgetTest";

export const dynamic = "force-dynamic";

const fallbackQuestions = [
  "How do I get started?",
  "Where do I change my settings?",
  "Why is this page empty?",
];

export default async function WidgetPage() {
  const repo = getRepo();
  const tenantId = await getCurrentDashboardTenantId();
  const [project, usage] = await Promise.all([
    repo.ensureDefaultProject(tenantId),
    repo.getUsageSummary(tenantId),
  ]);
  const config = project.widgetConfig;
  const initialUrl = project.allowedOrigins.find((origin) => {
    if (origin.includes("*")) return false;
    try {
      const url = new URL(origin);
      const hostname = url.hostname.toLowerCase();
      return (url.protocol === "https:" || url.protocol === "http:")
        && hostname !== "localhost" && !hostname.endsWith(".localhost")
        && hostname !== "127.0.0.1" && hostname !== "[::1]";
    } catch {
      return false;
    }
  }) ?? "";
  const parsedGuide = parseStudioGuide(project.skillContent);
  const guideQuestions = parsedGuide.ok
    ? parsedGuide.guide.tasks.flatMap((task) => task.userQuestions).map((question) => question.trim()).filter(Boolean).slice(0, 3)
    : [];
  const suggestedQuestions = guideQuestions.length > 0 ? guideQuestions : fallbackQuestions;
  // Same "has a paid plan" rule as the sidebar and Go live: a workspace with a minute cap is on a plan.
  const hasPaidPlan = usage.capSeconds > 0;

  return (
    <div className="space-y-6">
      {!hasPaidPlan && (
        <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-accent-line bg-accent-soft px-4 py-3 text-sm text-accent-text">
          <StatusPill tone="amber" label="Test mode" className="shrink-0 uppercase tracking-wide" />
          <p className="min-w-0 flex-1">
            Only you can talk to Skilly right now. Visitors won&apos;t see it until you go live.
          </p>
        </div>
      )}

      <header>
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent-text">Step 2 of 3 · Try it</p>
        <h1 className="mt-3 text-[30px] font-bold leading-tight tracking-[-0.035em] text-fg">
          Talk to Skilly on your own site.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">Ask what a new user would ask.</p>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Panel id="customer-website-preview" className="scroll-mt-24">
          <PanelBody>
            <div className="[&>div]:!grid-cols-1 [&>div>div:first-child]:order-2 [&>div>div:last-child]:order-1 [&_button.bg-accent]:!bg-surface [&_button.bg-accent]:!text-fg [&_button.bg-accent]:!shadow-none [&_button.bg-accent:hover]:!bg-surface-strong">
              <CustomerWebsitePreview
                initialUrl={initialUrl}
                skillId={project.skillId}
                accentColor={config.accentColor}
                launcherLabel={config.launcherLabel}
              />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-fg-muted">
              If your site blocks embedding, Studio shows a generated copy instead. Pointing on the real site starts working once the script is installed.
            </p>
          </PanelBody>
        </Panel>

        <aside className="space-y-4">
          <Panel>
            <PanelBody>
              <h2 className="text-base font-bold tracking-[-0.01em] text-fg">Try asking</h2>
              <ul className="mt-3 space-y-2">
                {suggestedQuestions.map((question, questionIndex) => (
                  <li
                    key={question}
                    className={`rounded-[9px] border px-3 py-3 text-sm leading-relaxed ${questionIndex === 0 ? "border-accent-line bg-accent-soft text-accent-text" : "border-line bg-surface-sunken text-fg"}`}
                  >
                    &quot;{question}&quot;
                  </li>
                ))}
              </ul>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelBody>
              <h2 className="text-base font-bold tracking-[-0.01em] text-fg">Did Skilly get it right?</h2>
              <div className="mt-4 grid grid-cols-[1fr_1.4fr] gap-2">
                <ButtonLink href="/dashboard/go-live">Yes</ButtonLink>
                <ButtonLink href="/dashboard/setup" className="px-2 text-xs">Not quite, fix guide</ButtonLink>
              </div>
            </PanelBody>
          </Panel>

          <ButtonLink
            href="/dashboard/go-live"
            variant="primary"
            className="h-12 w-full"
            analyticsEvent="dashboard_try_it_go_live_clicked"
          >
            It works. Go live →
          </ButtonLink>
        </aside>
      </div>

      <details className="rounded-[16px] border border-line bg-surface">
        <summary className="cursor-pointer px-[18px] py-[17px] text-sm font-bold text-fg">
          Widget states (for reference)
        </summary>
        <div className="border-t border-line-soft p-[18px]">
          <StudioAssistantPreview accentColor={config.accentColor} />
        </div>
      </details>
    </div>
  );
}
