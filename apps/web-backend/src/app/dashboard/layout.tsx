import type { ReactNode } from "react";
import { getRepo } from "@/db";
import { getWorkspaceLiveness } from "@/lib/workspaceLiveness";
import { isInternalAnalyticsEmail } from "@/lib/analyticsPolicy";
import { requireDashboardSession } from "@/lib/dashboardAuth";
import { hasDashboardPeopleSurface } from "@/lib/dashboardSurfaces";
import { AnalyticsProvider } from "../AnalyticsProvider";
import { AppShell } from "./v2";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireDashboardSession();
  const tenantId = session.tenantId;
  const repo = getRepo();
  const [tenant, liveness, switchableTenants, usage] = await Promise.all([
    repo.getTenant(tenantId),
    getWorkspaceLiveness(repo, tenantId),
    // Only super_admins see the tenant switcher; load the directory for them.
    session.role === "super_admin" ? repo.listTenants() : Promise.resolve([]),
    repo.getUsageSummary(tenantId),
  ]);

  return (
    <AnalyticsProvider
      tenantId={tenantId}
      roleSurface={session.role}
      analyticsSuppressed={isInternalAnalyticsEmail(session.email)}
      workosUserId={session.workosUserId}
    >
      <AppShell
        tenantName={tenant?.name ?? "Workspace"}
        role={session.role}
        accountEmail={session.email ?? null}
        isLive={liveness.isLive}
        hasSkill={liveness.hasSkill}
        hasPreviewed={liveness.hasPreviewed}
        switchableTenants={switchableTenants}
        currentTenantId={tenantId}
        usedSecondsThisMonth={usage.usageSecondsThisPeriod}
        usageCapSeconds={usage.capSeconds}
        hasPeopleSurface={hasDashboardPeopleSurface(session)}
      >
        {children}
      </AppShell>
    </AnalyticsProvider>
  );
}
