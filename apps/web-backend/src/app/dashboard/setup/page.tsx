import { cookies } from "next/headers";
import type { ReactElement } from "react";
import { getRepo } from "@/db";
import { parseStudioGuide } from "@/domain/studioGuide";
import { getCurrentDashboardTenantId } from "@/lib/session";
import { ButtonLink, PageHeader, Panel, PanelBody } from "../v2";
import { SkillEditor } from "../skill/SkillEditor";
import { GuideReview } from "./GuideReview";

export const dynamic = "force-dynamic";

type SetupPageProps = { searchParams?: Promise<{ drafted?: string }> };

export default function SetupPage(): Promise<ReactElement>;
export default function SetupPage(props: SetupPageProps): Promise<ReactElement>;
export default async function SetupPage({ searchParams }: SetupPageProps = {}) {
  const repo = getRepo();
  const tenantId = await getCurrentDashboardTenantId();
  const project = await repo.ensureDefaultProject(tenantId);
  const parsedGuide = parseStudioGuide(project.skillContent);

  let draftedHost = "";
  if ((await searchParams)?.drafted === "1") {
    const provenance = (await cookies()).get("skilly_guide_draft")?.value;
    try {
      const value: unknown = provenance ? JSON.parse(provenance) : null;
      if (value && typeof value === "object" && "tenantId" in value && value.tenantId === tenantId && "host" in value && typeof value.host === "string") draftedHost = value.host;
    } catch { draftedHost = ""; }
  }
  if (parsedGuide.ok) return <div className="space-y-5">
    {draftedHost && <p role="status" className="rounded-[14px] border border-success/25 bg-success-soft px-4 py-3 text-sm text-success">Skilly drafted this from {draftedHost}. Check each step, then try it.</p>}
    <GuideReview initialGuide={parsedGuide.guide} />
  </div>;

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
