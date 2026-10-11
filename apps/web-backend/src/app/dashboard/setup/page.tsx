import { getRepo } from "@/db";
import { parseStudioGuide } from "@/domain/studioGuide";
import { getCurrentDashboardTenantId } from "@/lib/session";
import { ButtonLink, PageHeader, Panel, PanelBody } from "../v2";
import { SkillEditor } from "../skill/SkillEditor";
import { GuideReview } from "./GuideReview";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const repo = getRepo();
  const tenantId = await getCurrentDashboardTenantId();
  const project = await repo.ensureDefaultProject(tenantId);
  const parsedGuide = parseStudioGuide(project.skillContent);

  if (parsedGuide.ok) return <GuideReview initialGuide={parsedGuide.guide} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Step 1 of 3 · Your guide"
        title="Here's the guide Skilly follows."
        description="Check what Skilly will say and point at. Plain language — no markdown needed."
        action={<ButtonLink href="/dashboard/skill">Edit as SKILL.md</ButtonLink>}
      />
      <Panel>
        <PanelBody>
          <p className="mb-4 text-sm text-fg-muted">This guide was written as SKILL.md, so it opens in the text editor.</p>
          <SkillEditor initialContent={project.skillContent} />
        </PanelBody>
      </Panel>
    </div>
  );
}
