import { mock } from "bun:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRepo, defaultSeed } from "../../src/db/memoryRepo";
import { serializeStudioGuide, type StudioGuide } from "../../src/domain/studioGuide";

const tenantId = defaultSeed().tenants[0]!.id;
mock.module("../../src/lib/session", () => ({ getCurrentDashboardTenantId: async () => tenantId }));
mock.module("../../src/app/dashboard/actions", () => ({ saveSkillAction: async () => ({ ok: true }), switchTenantAction: async () => {} }));
mock.module("next/navigation", () => ({ useRouter: () => ({ push: () => {} }), usePathname: () => "/dashboard/widget" }));

const { GuideReview } = await import("../../src/app/dashboard/setup/GuideReview");
const { default: WidgetPage } = await import("../../src/app/dashboard/widget/page");
const repo = new MemoryRepo();
globalThis.__skillyRepo = repo;
const project = await repo.ensureDefaultProject(tenantId);

const emptyGuide = { productName: "Acme", intro: "", tone: "friendly", facts: [], tasks: [] } satisfies StudioGuide;
const saveEvents = ["dashboard_guide_saved_clicked", "dashboard_guide_save_and_try_clicked"];
function assertSaveDisabled(guideHtml: string, disabled: boolean) {
  for (const saveEvent of saveEvents) {
    const saveButton = guideHtml.match(new RegExp(`<button[^>]*data-analytics-event="${saveEvent}"[^>]*>`))?.[0];
    assert(saveButton);
    assert.equal(saveButton.includes('disabled=""'), disabled);
  }
  assert.equal(guideHtml.includes("Add a task with at least one written step to save."), disabled);
}
function renderGuide(guide: StudioGuide) {
  return renderToStaticMarkup(createElement(GuideReview, { initialGuide: guide }));
}

const emptyGuideHtml = renderGuide(emptyGuide);
const draftLink = emptyGuideHtml.match(/<a[^>]*href="\/onboarding\/start"[^>]*>Draft it from my site<\/a>/)?.[0];
assert(draftLink?.includes("bg-accent text-accent-fg"));
assert(emptyGuideHtml.includes("or start from scratch"));
assert(emptyGuideHtml.indexOf("or start from scratch") < emptyGuideHtml.indexOf("Create first project"));
assert(!emptyGuideHtml.includes("Safety check passed"));
assert(emptyGuideHtml.includes('class="font-mono text-xs font-semibold uppercase tracking-wider text-accent-text">Step 1 of 3 · Your guide'));
for (const taskChip of [...emptyGuideHtml.matchAll(/<button[^>]*data-analytics-event="dashboard_guide_task_added"[^>]*>/g)]) {
  assert(!taskChip[0].includes("bg-accent text-accent-fg"));
}
assertSaveDisabled(emptyGuideHtml, true);

const firstTask = { title: "Connect data", goal: "Connect a source", userQuestions: ["How do I connect a source?", "Where are integrations?"], steps: [] };
const taskWithoutSteps = { ...emptyGuide, tasks: [firstTask] } satisfies StudioGuide;
const taskWithoutStepsHtml = renderGuide(taskWithoutSteps);
assert(taskWithoutStepsHtml.includes("Safety check passed"));
assertSaveDisabled(taskWithoutStepsHtml, true);
assertSaveDisabled(renderGuide({ ...taskWithoutSteps, tasks: [{ ...firstTask, steps: [{ say: " \t ", pointsAt: "Connect" }] }] }), true);
const factsOnlyHtml = renderGuide({ ...emptyGuide, facts: ["A source populates the dashboard."] });
assert(factsOnlyHtml.includes("Safety check passed"));
assertSaveDisabled(factsOnlyHtml, true);
const completeGuide = {
  ...taskWithoutSteps,
  tasks: [firstTask, { ...firstTask, title: "Invite a teammate", userQuestions: ["How do I invite my team?", "Can I invite guests?"], steps: [{ say: "Open the team page.", pointsAt: "Team" }] }],
} satisfies StudioGuide;
assertSaveDisabled(renderGuide(completeGuide), false);

await repo.saveProjectSkill(project.id, serializeStudioGuide(completeGuide));
await repo.setProjectOrigins(project.id, ["https://*.acme.com", "http://localhost:4310", "http://test.localhost", "http://127.0.0.1:3000", "http://[::1]:3000", "ftp://acme.com", "not a URL", "https://app.acme.com", "https://later.acme.com"]);
const widgetHtml = renderToStaticMarkup(await WidgetPage());
assert(widgetHtml.includes('value="https://app.acme.com"'));
assert(widgetHtml.includes('<iframe src="https://app.acme.com" title="Live preview of app.acme.com"'));
assert(!widgetHtml.includes('<iframe src="https://later.acme.com"'));
for (const question of ["How do I connect a source?", "Where are integrations?", "How do I invite my team?"]) assert(widgetHtml.includes(question));
assert(!widgetHtml.includes("Can I invite guests?"));
assert(!widgetHtml.includes("How do I get started?"));

await repo.setProjectOrigins(project.id, ["https://*.acme.com", "http://localhost:4310"]);
await repo.saveProjectSkill(project.id, serializeStudioGuide(emptyGuide));
const noSiteHtml = renderToStaticMarkup(await WidgetPage());
assert(noSiteHtml.includes('value=""'));
assert(!noSiteHtml.includes("<iframe"));
for (const question of ["How do I get started?", "Where do I change my settings?", "Why is this page empty?"]) assert(noSiteHtml.includes(question));

await repo.setProjectOrigins(project.id, ["http://app.acme.com", "https://app.acme.com"]);
await repo.saveProjectSkill(project.id, "# Custom guide\n\n## Custom instructions\nUse the original editor.");
const customGuideHtml = renderToStaticMarkup(await WidgetPage());
assert(customGuideHtml.includes('<iframe src="http://app.acme.com"'));
assert(customGuideHtml.includes("How do I get started?"));
console.log("Guide empty/save states and Try it initial site/questions rendered successfully.");
