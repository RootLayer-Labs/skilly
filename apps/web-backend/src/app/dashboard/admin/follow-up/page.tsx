import Link from "next/link";
import { getRepo } from "@/db";
import { requireDashboardSession } from "@/lib/dashboardAuth";
import { listMacCheckoutDropoffs } from "@/lib/macSession";
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

// ponytail: name/email heuristic for our own test and demo accounts; switch to a flag on tenants if it misfires.
function isInternalAccount(email: string | null, workspaceName = ""): boolean {
  return Boolean(email?.toLowerCase().endsWith("@tryskilly.app")) || /^test\b|^test\+|\(demo\)/i.test(workspaceName);
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function checkoutFollowUpEmailHref(email: string, checkoutStartedAt: Date): string {
  const subject = "Your Skilly upgrade";
  const body = `Hi,\n\nI'm Mohamed, I build Skilly. I saw you started upgrading on ${formatShortDate(checkoutStartedAt)} but didn't finish, and I wanted to check whether something got in the way. Was it the price, the payment page, or something Skilly didn't do well enough yet?\n\nA one-line reply helps me a lot. If you still want to upgrade, reply and I'll send you a fresh link.\n\nMohamed`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function followUpEmailHref(email: string, workspaceName: string): string {
  const subject = "Getting Skilly live on your site";
  const body = `Hi,\n\nI saw you started setting up Skilly for ${workspaceName}. Anything I can help with to get it live? Everything you need is on https://studio.tryskilly.app/dashboard/go-live, or I'm happy to jump on a quick call.\n\nMohamed`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default async function FollowUpPage() {
  await requireDashboardSession("super_admin");
  const repo = getRepo();
  const [tenants, signups, macCheckoutDropoffs] = await Promise.all([
    repo.listTenants(),
    repo.listTenantSignups(),
    listMacCheckoutDropoffs(),
  ]);
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
  const customerRows = rows.filter((row) => !isInternalAccount(row.ownerEmail, row.tenant.name));
  // "Tried to pay, didn't": reached Polar checkout but has no active plan. Mac users and builder workspaces together.
  const triedToPay = [
    ...macCheckoutDropoffs
      .filter((dropoff) => !isInternalAccount(dropoff.email))
      .map((dropoff) => ({ key: `mac-${dropoff.userId}`, product: "Mac app", name: dropoff.email ?? dropoff.userId, email: dropoff.email, checkoutStartedAt: dropoff.checkoutStartedAt, status: dropoff.status })),
    ...customerRows
      .filter((row) => row.signup?.checkoutStartedAt && row.signup.providerState !== "active")
      .map((row) => ({ key: `studio-${row.tenant.id}`, product: "Studio", name: row.tenant.name, email: row.ownerEmail, checkoutStartedAt: row.signup!.checkoutStartedAt!, status: row.signup?.providerState ?? "none" })),
  ].sort((left, right) => right.checkoutStartedAt.getTime() - left.checkoutStartedAt.getTime());
  const notLive = customerRows
    .filter((row) => !row.liveness.isLive)
    .sort((left, right) => (right.signup?.createdAt.getTime() ?? 0) - (left.signup?.createdAt.getTime() ?? 0));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform · Follow-ups"
        title="People to follow up with."
        description="Customers who tried to pay but didn't, and builders who signed up but aren't live. Our own test and demo accounts are hidden."
      />

      <Panel>
        <PanelHeader
          title={`Tried to pay, didn't · ${triedToPay.length}`}
          description="Reached Polar checkout but have no active plan. Most recent attempt first."
        />
        <PanelBody>
          {triedToPay.length > 0 ? (
            <DataTable>
              <DataTableHeader>
                <Th>Customer</Th>
                <Th>Product</Th>
                <Th>Checkout opened</Th>
                <Th>Status</Th>
              </DataTableHeader>
              <DataTableBody>
                {triedToPay.map((attempt) => (
                  <Tr key={attempt.key}>
                    <Td>
                      {attempt.email ? (
                        <a
                          href={checkoutFollowUpEmailHref(attempt.email, attempt.checkoutStartedAt)}
                          data-analytics-event="dashboard_follow_up_checkout_email_clicked"
                          className="text-accent-text underline"
                        >
                          {attempt.product === "Studio" ? `${attempt.name} · ${attempt.email}` : attempt.email}
                        </a>
                      ) : (
                        attempt.name
                      )}
                    </Td>
                    <Td>{attempt.product}</Td>
                    <Td>{formatShortDate(attempt.checkoutStartedAt)}</Td>
                    <Td><StatusPill tone="amber" label={attempt.status} /></Td>
                  </Tr>
                ))}
              </DataTableBody>
            </DataTable>
          ) : (
            <p className="text-sm text-fg-muted">No open checkout attempts. Attempts are recorded from today; earlier ones are only in PostHog.</p>
          )}
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader
          title={`Signed up, not live · ${notLive.length}`}
          description="Builder workspaces without a real conversation on their site yet. Newest signups first."
        />
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
                          ? `${formatShortDate(signup.createdAt)} · ${daysSinceSignup === 0 ? "today" : `${daysSinceSignup}d ago`}`
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
