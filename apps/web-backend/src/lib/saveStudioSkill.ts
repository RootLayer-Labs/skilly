import { getRepo } from "@/db";
import { validateSkillContent } from "@/domain/skillValidation";
import { getDashboardProjectSelection } from "@/lib/dashboardProject";

export async function saveStudioSkill({ tenantId, content }: { tenantId: string; content: string }): Promise<
  { ok: true; skillId: string } | { ok: false; issues: string[] }
> {
  const validation = validateSkillContent(content);
  if (!validation.ok) return { ok: false, issues: validation.issues };
  const repo = getRepo();
  const { project } = await getDashboardProjectSelection(repo);
  await repo.saveProjectSkill(project.id, content);
  await repo.saveTenantSkill(tenantId, project.skillId, content);
  return { ok: true, skillId: project.skillId };
}
