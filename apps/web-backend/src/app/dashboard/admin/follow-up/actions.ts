"use server";

import { revalidatePath } from "next/cache";
import { captureServerEvent } from "@/lib/analytics";
import { requireDashboardSession } from "@/lib/dashboardAuth";
import { compMacPlan, extendMacTrial } from "@/lib/macSession";
import { PERSONAL_TRIAL_SECONDS } from "@/domain/personalAccess";

function userIdFromForm(formData: FormData): string {
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId.trim()) throw new Error("A Mac user ID is required");
  return userId.trim();
}

export async function extendMacTrialAction(formData: FormData): Promise<void> {
  const session = await requireDashboardSession("super_admin");
  const userId = userIdFromForm(formData);
  await extendMacTrial(userId);
  await captureServerEvent("staff_mac_trial_extended", {
    workos_user_id: userId,
    extended_seconds: PERSONAL_TRIAL_SECONDS,
    staff_email: session.email ?? null,
  });
  revalidatePath("/dashboard/admin/follow-up");
}

export async function compMacPlanAction(formData: FormData): Promise<void> {
  const session = await requireDashboardSession("super_admin");
  const userId = userIdFromForm(formData);
  await compMacPlan(userId);
  await captureServerEvent("staff_mac_plan_comped", {
    workos_user_id: userId,
    days: 30,
    minutes: 30,
    staff_email: session.email ?? null,
  });
  revalidatePath("/dashboard/admin/follow-up");
}
