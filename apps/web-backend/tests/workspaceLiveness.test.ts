import { afterEach, describe, expect, test } from "bun:test";
import { MemoryRepo, defaultSeed } from "../src/db/memoryRepo";
import { getWorkspaceLiveness } from "../src/lib/workspaceLiveness";

const tenantId = defaultSeed().tenants[0]!.id;
const originalRedirectUri = process.env.WORKOS_DASHBOARD_REDIRECT_URI;

afterEach(() => {
  if (originalRedirectUri === undefined) delete process.env.WORKOS_DASHBOARD_REDIRECT_URI;
  else process.env.WORKOS_DASHBOARD_REDIRECT_URI = originalRedirectUri;
});

describe("workspace liveness", () => {
  test("requires a customer widget load and a real session before going live", async () => {
    const repo = new MemoryRepo();
    const project = await repo.ensureDefaultProject(tenantId);
    expect(await getWorkspaceLiveness(repo, tenantId)).toMatchObject({
      hasSkill: true,
      hasSurface: true,
      hasPublishableKey: true,
      installedAt: null,
      installedOrigin: null,
      firstLiveSessionAt: null,
      isInstalled: false,
      isLive: false,
      stepsCompleted: 2,
      stepsTotal: 4,
    });

    const seenAt = new Date();
    await repo.recordProjectWidgetSeen(project.id, "app.acme.com", seenAt);
    expect(await getWorkspaceLiveness(repo, tenantId)).toMatchObject({
      installedAt: seenAt,
      installedOrigin: "app.acme.com",
      isInstalled: true,
      isLive: false,
      stepsCompleted: 3,
    });

    await repo.recordUsage({ tenantId, kind: "session_seconds", seconds: 20, domain: "app.acme.com" });
    const liveness = await getWorkspaceLiveness(repo, tenantId);
    expect(liveness.isLive).toBe(true);
    expect(liveness.stepsCompleted).toBe(4);
    expect(liveness.firstLiveSessionAt).toEqual((await repo.listRecentSessions(tenantId, 1))[0]!.createdAt);
  });

  test("excludes Studio, configured local previews, missing domains, and non-session usage", async () => {
    process.env.WORKOS_DASHBOARD_REDIRECT_URI = "http://localhost:4310/api/auth/workos/callback";
    const repo = new MemoryRepo();
    const project = await repo.ensureDefaultProject(tenantId);
    await repo.recordProjectWidgetSeen(project.id, "app.acme.com");
    for (const domain of ["studio.tryskilly.app", "localhost:4310", null, " "]) {
      await repo.recordUsage({ tenantId, kind: "session_seconds", seconds: 20, domain });
    }
    await repo.recordUsage({ tenantId, kind: "token_mint", seconds: 0, domain: "app.acme.com" });
    await repo.recordUsage({ tenantId, kind: "action", seconds: 0, domain: "app.acme.com" });
    expect(await getWorkspaceLiveness(repo, tenantId)).toMatchObject({ firstLiveSessionAt: null, isLive: false });
  });

  test("a session alone cannot imply installation", async () => {
    const repo = new MemoryRepo();
    await repo.recordUsage({ tenantId, kind: "session_seconds", seconds: 20, domain: "app.acme.com" });
    expect(await getWorkspaceLiveness(repo, tenantId)).toMatchObject({ isInstalled: false, isLive: false, stepsCompleted: 2 });
  });

  test("newer previews cannot hide older real sessions", async () => {
    const repo = new MemoryRepo();
    const project = await repo.ensureDefaultProject(tenantId);
    await repo.recordProjectWidgetSeen(project.id, "app.acme.com");
    await repo.recordUsage({ tenantId, kind: "session_seconds", seconds: 20, domain: "app.acme.com", result: "error" });
    const firstSession = (await repo.listRecentSessions(tenantId, 1))[0]!;
    for (let index = 0; index < 100; index++) {
      await repo.recordUsage({ tenantId, kind: "session_seconds", seconds: 20, domain: "studio.tryskilly.app" });
    }
    expect(await getWorkspaceLiveness(repo, tenantId)).toMatchObject({ isLive: true, firstLiveSessionAt: firstSession.createdAt });
  });

  test("keeps tenant sightings and usage isolated", async () => {
    const repo = new MemoryRepo();
    const project = await repo.ensureDefaultProject(tenantId);
    const other = await repo.createTenant({ name: "Other", allowedOrigins: ["https://other.example"] });
    const otherProject = await repo.ensureDefaultProject(other.id);
    await repo.recordProjectWidgetSeen(otherProject.id, "other.example");
    await repo.recordUsage({ tenantId: other.id, kind: "session_seconds", seconds: 20, domain: "other.example" });
    expect(await getWorkspaceLiveness(repo, tenantId)).toMatchObject({ installedAt: null, firstLiveSessionAt: null, isLive: false });
    await repo.recordProjectWidgetSeen(project.id, "app.acme.com");
    expect(await getWorkspaceLiveness(repo, tenantId)).toMatchObject({ isInstalled: true, isLive: false });
  });

  test("counts trimmed skill and allowed app IDs, and ignores revoked or secret keys", async () => {
    const repo = new MemoryRepo();
    const project = await repo.ensureDefaultProject(tenantId);
    await repo.saveProjectSkill(project.id, " \n ");
    await repo.setProjectOrigins(project.id, []);
    await repo.setProjectAppIds(project.id, []);
    const keys = await repo.listApiKeys(tenantId);
    await repo.revokeApiKey(tenantId, keys[0]!.id);
    await repo.createApiKey(tenantId, "secret");
    expect(await getWorkspaceLiveness(repo, tenantId)).toMatchObject({ hasSkill: false, hasSurface: false, hasPublishableKey: false, stepsCompleted: 0 });
    await repo.setProjectAppIds(project.id, ["com.acme.app"]);
    expect(await getWorkspaceLiveness(repo, tenantId)).toMatchObject({ hasSurface: true, stepsCompleted: 1 });
  });
});

describe("memory repo widget sightings", () => {
  test("reads sighting fields through each project lookup", async () => {
    const repo = new MemoryRepo();
    const project = await repo.ensureDefaultProject(tenantId);
    const seenAt = new Date();
    await repo.recordProjectWidgetSeen(project.id, "app.acme.com", seenAt);
    for (const stored of [
      await repo.getProject(tenantId, project.id),
      await repo.ensureDefaultProject(tenantId),
      await repo.getProjectBySkillId(tenantId, project.skillId),
      (await repo.listProjects(tenantId))[0],
    ]) {
      expect(stored).toMatchObject({ widgetLastSeenAt: seenAt, widgetLastSeenOrigin: "app.acme.com" });
    }
  });

  test("throttles frequent page loads but updates sightings older than five minutes", async () => {
    const repo = new MemoryRepo();
    const project = await repo.ensureDefaultProject(tenantId);
    const oldSeenAt = new Date(Date.now() - 6 * 60_000);
    await repo.recordProjectWidgetSeen(project.id, "old.acme.com", oldSeenAt);
    const recentSeenAt = new Date();
    await repo.recordProjectWidgetSeen(project.id, "app.acme.com", recentSeenAt);
    await repo.recordProjectWidgetSeen(project.id, "another.acme.com");
    expect(await repo.getProject(tenantId, project.id)).toMatchObject({ widgetLastSeenAt: recentSeenAt, widgetLastSeenOrigin: "app.acme.com" });
  });
});
