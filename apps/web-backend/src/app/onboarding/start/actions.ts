"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getRepo } from "@/db";
import { serializeStudioGuide } from "@/domain/studioGuide";
import { captureServerEvent } from "@/lib/analytics";
import { requireDashboardSession } from "@/lib/dashboardAuth";
import { getDashboardProjectSelection } from "@/lib/dashboardProject";
import { draftStudioGuide, normalizeGuideUrl, UnsafeGuideUrlError } from "@/lib/guideDraft";
import { saveStudioSkill } from "@/lib/saveStudioSkill";

export type DraftGuideState = { error?: string };

export async function draftGuideAction(_previous: DraftGuideState, formData: FormData): Promise<DraftGuideState> {
  const session = await requireDashboardSession();
  const productUrl = String(formData.get("productUrl") ?? "").trim();
  const firstTask = String(formData.get("firstTask") ?? "").trim();
  const docsUrl = String(formData.get("docsUrl") ?? "").trim();
  if (!firstTask || firstTask.length > 100) return { error: "Choose the first thing a new user should get done, in 100 characters or fewer." };
  let draft;
  try { draft = await draftStudioGuide({ productUrl, firstTask, docsUrl }); }
  catch (error) {
    if (error instanceof UnsafeGuideUrlError) return { error: error.message };
    throw error;
  }
  const tenantId = session.tenantId;
  const savedSkill = await saveStudioSkill({ tenantId, content: serializeStudioGuide(draft.guide) });
  if (!savedSkill.ok) return { error: savedSkill.issues.join(" ") };
  const repo = getRepo();
  const [{ project }, tenant] = await Promise.all([getDashboardProjectSelection(repo), repo.getTenant(tenantId)]);
  const url = normalizeGuideUrl(productUrl);
  if (project.allowedOrigins.length === 0) await repo.setProjectOrigins(project.id, [url.origin]);
  if (tenant && tenant.allowedOrigins.length === 0) await repo.setTenantOrigins(tenantId, [url.origin]);
  const cookieStore = await cookies();
  cookieStore.set("skilly_guide_draft", JSON.stringify({ tenantId, host: url.host }), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 300, path: "/dashboard/setup",
  });
  await captureServerEvent("studio_guide_drafted", {
    tenant_id: tenantId, source: draft.source, task_count: draft.guide.tasks.length,
    step_count: draft.guide.tasks.reduce((count, task) => count + task.steps.length, 0),
  }, session.workosUserId);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/setup?drafted=1");
}
