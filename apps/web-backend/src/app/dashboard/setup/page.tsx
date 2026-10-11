import Link from "next/link";
import { getRepo } from "@/db";
import { getWorkspaceLiveness } from "@/lib/workspaceLiveness";
import { getCurrentDashboardTenantId } from "@/lib/session";
import { ProjectContextPanel } from "../ProjectContextPanel";
import {
  ButtonLink,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  StatusPill,
} from "../v2";
import { SkillEditor } from "../skill/SkillEditor";
import { WidgetConfigForm } from "../widget/WidgetConfigForm";

export const dynamic = "force-dynamic";

const steps = [
  {
    id: "teach",
    title: "Teach",
    description: "What Skilly explains and points to",
  },
  {
    id: "style",
    title: "Style (optional)",
    description: "Accent, language, launcher label",
  },
] as const;

export default async function SetupPage() {
  const repo = getRepo();
  const tenantId = await getCurrentDashboardTenantId();
  const [project, liveness] = await Promise.all([
    repo.ensureDefaultProject(tenantId),
    getWorkspaceLiveness(repo, tenantId),
  ]);
  const config = project.widgetConfig;

  const stepCompletion = {
    teach: liveness.hasSkill,
    style: false,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="For builders · Guide"
        title="Teach Skilly your product."
        description="Write the guide Skilly uses to teach your product, then optionally style the launcher."
      />

      <ProjectContextPanel skillId={project.skillId} surfaces={["Teach", "Style"]} />

      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-[calc(var(--spacing-topbar)+24px)] lg:self-start">
          <div className="grid gap-2">
            {steps.map((step) => {
              const done = stepCompletion[step.id];
              return (
                <Link
                  key={step.id}
                  href={`#${step.id}`}
                  className="flex items-start gap-3 rounded-[14px] border border-line bg-surface p-3.5 transition hover:bg-surface-strong"
                >
                  <span
                    className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      done
                        ? "bg-success-soft text-success"
                        : "border border-accent-line text-accent-text"
                    }`}
                  >
                    {done ? "✓" : step.id === "style" ? "·" : 1}
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-fg">{step.title}</span>
                    <span className="mt-0.5 block text-xs text-fg-muted">{step.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </aside>

        <div className="space-y-5">
          <div id="teach" className="scroll-mt-24">
            <Panel>
              <PanelHeader
                title="Teach Skilly about this project"
                description="Plain markdown. This is the project-specific skill that ships with the selected site or app."
                action={<ButtonLink href="/dashboard/skill" variant="secondary">Full editor</ButtonLink>}
              />
              <PanelBody>
                <SkillEditor initialContent={project.skillContent} saveButtonVariant="secondary" />
              </PanelBody>
            </Panel>
          </div>

          <div id="style" className="scroll-mt-24">
            <Panel>
              <PanelHeader
                title="Style the launcher (optional)"
                description="Baked into the install snippet. Change any time before or after launch."
                action={<StatusPill tone="neutral" label={config.accentColor} />}
              />
              <PanelBody>
                <WidgetConfigForm
                  saveButtonVariant="secondary"
                  initialAccentColor={config.accentColor}
                  initialLocale={config.locale}
                  initialLauncherLabel={config.launcherLabel ?? ""}
                  initialActionsEnabled={config.actionsEnabled}
                  initialGuestSessionCapSeconds={config.guestSessionCapSeconds}
                />
              </PanelBody>
            </Panel>
          </div>

          <Panel>
            <PanelHeader title="Next: put Skilly on your site" />
            <PanelBody>
              <div className="flex flex-wrap gap-2.5">
                <ButtonLink
                  href="/dashboard/go-live"
                  variant="primary"
                  analyticsEvent="dashboard_guide_next_clicked"
                >
                  Put Skilly on your site
                </ButtonLink>
                <ButtonLink href="/dashboard/widget" variant="secondary">Try it first</ButtonLink>
              </div>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  );
}
