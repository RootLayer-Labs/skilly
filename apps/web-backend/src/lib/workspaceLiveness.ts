import type { WebBackendRepo } from "@/db/repo";

export interface WorkspaceLiveness {
  hasSkill: boolean;
  hasPreviewed: boolean;
  hasSurface: boolean;
  hasPublishableKey: boolean;
  installedAt: Date | null;
  installedOrigin: string | null;
  firstLiveSessionAt: Date | null;
  isInstalled: boolean;
  isLive: boolean;
  stepsCompleted: number;
  stepsTotal: 3;
}

function studioHosts(): Set<string> {
  const hosts = new Set(["studio.tryskilly.app"]);
  const redirectUri = process.env.WORKOS_DASHBOARD_REDIRECT_URI;
  if (redirectUri) {
    try {
      hosts.add(new URL(redirectUri).host);
    } catch {
      // A malformed redirect URI just means only the canonical Studio host is excluded.
    }
  }
  return hosts;
}

export async function getWorkspaceLiveness(repo: WebBackendRepo, tenantId: string): Promise<WorkspaceLiveness> {
  const [project, keys, sessions] = await Promise.all([
    repo.ensureDefaultProject(tenantId),
    repo.listApiKeys(tenantId),
    // ponytail: scans the latest 200 sessions; a workspace whose last 200 were all Studio previews reads as not live. Add a dedicated EXISTS query if that ever happens.
    repo.listRecentSessions(tenantId, 200),
  ]);
  const excludedHosts = studioHosts();
  const firstLiveSessionAt = sessions.reduce<Date | null>((earliest, session) => {
    if (!session.domain?.trim() || excludedHosts.has(session.domain.trim())) return earliest;
    return !earliest || session.createdAt < earliest ? session.createdAt : earliest;
  }, null);
  const hasSkill = Boolean(project.skillContent.trim());
  const hasSurface = Boolean(project.allowedOrigins.length || project.allowedAppIds.length);
  const installedAt = project.widgetLastSeenAt ?? null;
  const isInstalled = installedAt !== null;
  const isLive = isInstalled && firstLiveSessionAt !== null;
  const hasPreviewed = project.previewedAt !== null || isInstalled || isLive;

  return {
    hasSkill,
    hasPreviewed,
    hasSurface,
    hasPublishableKey: keys.some((key) => key.keyType === "publishable" && !key.revoked),
    installedAt,
    installedOrigin: project.widgetLastSeenOrigin ?? null,
    firstLiveSessionAt,
    isInstalled,
    isLive,
    stepsCompleted: [hasSkill, hasPreviewed, isLive].filter(Boolean).length,
    stepsTotal: 3,
  };
}
