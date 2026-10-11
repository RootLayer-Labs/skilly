import { afterEach, describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { MemoryRepo, DEMO_PUBLISHABLE_KEY, defaultSeed } from "../src/db/memoryRepo";
import { GET } from "../src/app/api/web/skill/route";

const tenantId = defaultSeed().tenants[0]!.id;

function skillRequest(origin: string | null, skillId = "default"): NextRequest {
  return new NextRequest(`http://localhost:4310/api/web/skill?skill=${skillId}`, {
    headers: { "X-Skilly-Key": DEMO_PUBLISHABLE_KEY, ...(origin ? { Origin: origin } : {}) },
  });
}

describe("/api/web/skill installation sightings", () => {
  afterEach(() => { globalThis.__skillyRepo = undefined; });

  test("Studio preview records its first preview time without recording an installation", async () => {
    const repo = new MemoryRepo();
    globalThis.__skillyRepo = repo;
    expect((await GET(skillRequest("http://localhost:4310"))).status).toBe(200);
    const project = await repo.ensureDefaultProject(tenantId);
    expect(project.previewedAt).toBeInstanceOf(Date);
    expect((await GET(skillRequest("http://localhost:4310"))).status).toBe(200);
    expect(await repo.ensureDefaultProject(tenantId)).toMatchObject({ previewedAt: project.previewedAt, widgetLastSeenAt: null, widgetLastSeenOrigin: null });
  });

  test("customer origin records the resolved project's installation", async () => {
    const repo = new MemoryRepo();
    globalThis.__skillyRepo = repo;
    const response = await GET(skillRequest("https://app.acme.com"));
    expect(response.status).toBe(200);
    const body = await response.json();
    const project = await repo.getProjectBySkillId(tenantId, "default");
    expect(body.projectId).toBe(project!.id);
    expect(project?.widgetLastSeenOrigin).toBe("app.acme.com");
    expect(project?.widgetLastSeenAt).toBeInstanceOf(Date);
    expect(project?.previewedAt).toBeNull();
  });

  test("preview write failure still serves the skill", async () => {
    class FailedPreviewRepo extends MemoryRepo {
      override async recordProjectPreviewed(): Promise<void> { throw new Error("database unavailable"); }
    }
    const repo = new FailedPreviewRepo();
    globalThis.__skillyRepo = repo;
    const response = await GET(skillRequest("http://localhost:4310"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ skillId: "default", content: defaultSeed().skills[0]!.content });
  });

  test("sighting write failure still serves the skill", async () => {
    class FailedSightingRepo extends MemoryRepo {
      override async recordProjectWidgetSeen(): Promise<void> { throw new Error("database unavailable"); }
    }
    const repo = new FailedSightingRepo();
    globalThis.__skillyRepo = repo;
    const response = await GET(skillRequest("https://app.acme.com"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ skillId: "default", content: defaultSeed().skills[0]!.content });
  });

  test("missing skill or rejected origin never records a sighting", async () => {
    const repo = new MemoryRepo();
    globalThis.__skillyRepo = repo;
    expect((await GET(skillRequest("https://app.acme.com", "missing"))).status).toBe(404);
    expect((await GET(skillRequest("http://localhost:4310", "missing"))).status).toBe(404);
    expect((await GET(skillRequest("https://unapproved.example"))).status).toBe(403);
    expect(await repo.ensureDefaultProject(tenantId)).toMatchObject({ previewedAt: null, widgetLastSeenAt: null, widgetLastSeenOrigin: null });
  });

  test("legacy-only skill has no resolved project to mark installed", async () => {
    const repo = new MemoryRepo();
    globalThis.__skillyRepo = repo;
    await repo.ensureDefaultProject(tenantId);
    await repo.saveTenantSkill(tenantId, "legacy", "# Legacy skill");
    const response = await GET(skillRequest("https://app.acme.com", "legacy"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ projectId: null, content: "# Legacy skill" });
    expect((await GET(skillRequest("http://localhost:4310", "legacy"))).status).toBe(200);
    expect(await repo.ensureDefaultProject(tenantId)).toMatchObject({ previewedAt: null, widgetLastSeenAt: null, widgetLastSeenOrigin: null });
  });
});
