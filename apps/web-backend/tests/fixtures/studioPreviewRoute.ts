import assert from "node:assert/strict";
import { mock } from "bun:test";
import { NextRequest } from "next/server";
import { MemoryRepo, defaultSeed } from "../../src/db/memoryRepo";

const tenantId = defaultSeed().tenants[0]!.id;
const repo = new MemoryRepo();
mock.module("../../src/db", () => ({ getRepo: () => repo }));
mock.module("@/db", () => ({ getRepo: () => repo }));
mock.module("@/lib/dashboardAuth", () => ({ getDashboardSession: async () => ({ tenantId, role: "tenant_admin" }) }));

const { GET } = await import("../../src/app/api/dashboard/test-widget/api/web/skill/route");
const project = await repo.ensureDefaultProject(tenantId);
const studioUrl = (skill?: string) => new NextRequest(`https://studio.tryskilly.app/api/dashboard/test-widget/api/web/skill${skill ? `?skill=${skill}` : ""}`);

// Studio's own setup assistant is not the builder trying Skilly on their site.
await GET(studioUrl("studio-guide"));
assert.equal((await repo.ensureDefaultProject(tenantId)).previewedAt, null);

// Fetching the builder's own guide in the Try it preview completes "Try it".
const response = await GET(studioUrl(project.skillId));
assert.equal(response.status, 200);
const firstPreviewedAt = (await repo.ensureDefaultProject(tenantId)).previewedAt;
assert.ok(firstPreviewedAt instanceof Date);

// Only the first preview is recorded.
await GET(studioUrl(project.skillId));
assert.equal((await repo.ensureDefaultProject(tenantId)).previewedAt, firstPreviewedAt);
console.log("Studio preview route records the first Try it preview only.");
