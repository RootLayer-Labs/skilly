import Link from "next/link";
import { getRepo } from "@/db";
import { requireDashboardSession } from "@/lib/dashboardAuth";
import { getWorkspaceLiveness, type WorkspaceLiveness } from "@/lib/workspaceLiveness";
import {
  DataTable,
  DataTableBody,
  DataTableHeader,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  StatusPill,
  Td,
  Th,
  Tr,
} from "../../v2";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Where a not-yet-live workspace is stuck, in the same three steps as the builder's Get live checklist. */
function stuckAtStep(liveness: WorkspaceLiveness): string {
  if (!liveness.hasSkill) return "Write the guide";
  if (!liveness.hasSurface) return "Add their site";
  if (!liveness.isInstalled) return "Install the script";
  return "First real conversation";
}

function followUpEmailHref(email: string, workspaceName: string): string {
  const subject = "Getting Skilly live on your site";
  const body = `Hi,\n\nI saw you started setting up Skilly for ${workspaceName}. Anything I can help with to get it live? Everything you need is on https://studio.tryskilly.app/dashboard/go-live, or I'm happy to jump on a quick call.\n\nMohamed`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default async function FollowUpPage() {
  await requireDashboardSession("super_admin");
  const repo = getRepo();
  const [tenants, signups] = await Promise.all([repo.listTenants(), repo.listTenantSignups()]);
  const signupByTenantId = new Map(signups.map((signup) => [signup.tenantId, signup]));
  const now = Date.now();

  const rows = await Promise.all(
    tenants.map(async (tenant) => {
      const [liveness, members] = await Promise.all([
        getWorkspaceLiveness(repo, tenant.id),
        repo.listDashboardMemberships(tenant.id),
      ]);
      const signup = signupByTenantId.get(tenant.id);
      const ownerEmail = (members.find((member) => member.role === "tenant_admin" && member.email) ?? members.find((member) => member.email))?.email ?? null;
      return { tenant, liveness, ownerEmail, signup };
    }),
  );
  const notLive = rows
    .filter((row) => !row.liveness.isLive)
    .sort((left, right) => (right.signup?.createdAt.getTime() ?? 0) - (left.signup?.createdAt.getTime() ?? 0));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform · Follow-ups"
        title="Signed up, not live yet."
        description="Builder workspaces that haven't had a real conversation on their site. Newest signups first."
      />

      <Panel>
        <PanelHeader title={`${notLive.length} ${notLive.length === 1 ? "workspace" : "workspaces"} to follow up`} />
        <PanelBody>
          {notLive.length > 0 ? (
            <DataTable>
              <DataTableHeader>
                <Th>Workspace</Th>
                <Th>Owner</Th>
                <Th>Signed up</Th>
                <Th>Stuck at</Th>
                <Th>Plan</Th>
              </DataTableHeader>
              <DataTableBody>
                {notLive.map(({ tenant, liveness, ownerEmail, signup }) => {
                  const daysSinceSignup = signup ? Math.floor((now - signup.createdAt.getTime()) / DAY_MS) : null;
                  return (
                    <Tr key={tenant.id}>
                      <Td>
                        <Link href={`/dashboard/admin/tenants/${tenant.id}`} className="font-bold text-fg underline-offset-2 hover:underline">
                          {tenant.name}
                        </Link>
                      </Td>
                      <Td>
                        {ownerEmail ? (
                          <a
                            href={followUpEmailHref(ownerEmail, tenant.name)}
                            data-analytics-event="dashboard_follow_up_email_clicked"
                            className="text-accent-text underline"
                          >
                            {ownerEmail}
                          </a>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td>
                        {signup
                          ? `${signup.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${daysSinceSignup === 0 ? "today" : `${daysSinceSignup}d ago`}`
                          : "—"}
                      </Td>
                      <Td>
                        <StatusPill tone="amber" label={`${liveness.stepsCompleted}/${liveness.stepsTotal} · ${stuckAtStep(liveness)}`} />
                      </Td>
                      <Td>{signup?.providerState ? <StatusPill tone={signup.providerState === "active" ? "green" : "neutral"} label={signup.providerState} /> : "—"}</Td>
                    </Tr>
                  );
                })}
              </DataTableBody>
            </DataTable>
          ) : (
            <p className="text-sm text-fg-muted">Every workspace is live.</p>
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}
