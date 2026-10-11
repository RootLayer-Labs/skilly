import { mock } from "bun:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRepo, defaultSeed } from "../../src/db/memoryRepo";

const tenantId = defaultSeed().tenants[0]!.id;
let pathname = "/dashboard/go-live";
const revalidatedPaths: string[] = [];
mock.module("next/cache", () => ({
  revalidatePath: (path: string) => { revalidatedPaths.push(path); },
}));
mock.module("../../src/lib/dashboardAuth", () => ({
  requireDashboardSession: async () => ({ role: "tenant_admin", tenantId, issuedAt: Date.now() }),
  setDashboardSession: async () => {},
}));
mock.module("../../src/lib/analytics", () => ({
  captureServerEvent: async () => {},
}));
mock.module("../../src/lib/session", () => ({
  getCurrentDashboardTenantId: async () => tenantId,
  DEFAULT_SKILL_ID: "default",
}));
mock.module("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ refresh: () => {} }),
  redirect: () => { throw new Error("Unexpected redirect"); },
}));

const { default: GoLivePage } = await import("../../src/app/dashboard/go-live/page");
const { default: DashboardPage } = await import("../../src/app/dashboard/page");
const { default: SetupPage } = await import("../../src/app/dashboard/setup/page");
const { default: UsagePage } = await import("../../src/app/dashboard/usage/page");
const { AppShell } = await import("../../src/app/dashboard/v2/AppShell");
const { addOriginAction, removeOriginAction } = await import("../../src/app/dashboard/actions");
const repo = new MemoryRepo();
globalThis.__skillyRepo = repo;
const project = await repo.ensureDefaultProject(tenantId);
await repo.setProjectOrigins(project.id, ["https://app.acme.com"]);

const waitingHtml = renderToStaticMarkup(await GoLivePage());
const headings = ["Your site", "Add one script tag", "Status", "Pick a plan when you&#x27;re ready (you can go live first)"];
for (let index = 0; index < headings.length; index++) {
  assert(waitingHtml.includes(headings[index]!));
  if (index > 0) assert(waitingHtml.indexOf(headings[index - 1]!) < waitingHtml.indexOf(headings[index]!));
}
assert(waitingHtml.includes("Waiting for Skilly on app.acme.com…"));
assert(waitingHtml.includes('name="origin"'));
assert(waitingHtml.includes("https://app.acme.com"));
assert(waitingHtml.includes('href="/dashboard/origins"'));
assert(waitingHtml.includes('data-analytics-event="dashboard_go_live_check_again_clicked"'));
assert(waitingHtml.includes('data-analytics-event="dashboard_go_live_email_developer_clicked"'));
assert(waitingHtml.includes("Replace pk_live_your_key with the full key you saved"));
const developerHref = waitingHtml.match(/href="(mailto:[^"]+)"/)?.[1]?.replaceAll("&amp;", "&");
assert(developerHref);
const emailParameters = new URLSearchParams(developerHref.slice("mailto:?".length));
assert.equal(emailParameters.get("subject"), "Add Skilly to our site");
assert(emailParameters.get("body")?.includes('data-skilly-key="pk_live_your_key"'));
assert(emailParameters.get("body")?.includes(`data-skilly-skill="${project.skillId}"`));
assert.equal((waitingHtml.match(/bg-accent text-accent-fg border border-line shadow-card hover:bg-accent-hover/g) ?? []).length, 1);

const addedOriginForm = new FormData();
addedOriginForm.set("origin", "added.acme.com");
await addOriginAction(addedOriginForm);
assert((await repo.ensureDefaultProject(tenantId)).allowedOrigins.includes("https://added.acme.com"));
assert((await repo.getTenant(tenantId))?.allowedOrigins.includes("https://added.acme.com"));
assert(renderToStaticMarkup(await GoLivePage()).includes("https://added.acme.com"));
assert.deepEqual(revalidatedPaths, ["/dashboard", "/dashboard/origins", "/dashboard/go-live"]);

revalidatedPaths.length = 0;
const removedOriginForm = new FormData();
removedOriginForm.set("origin", "https://added.acme.com");
await removeOriginAction(removedOriginForm);
assert(!(await repo.ensureDefaultProject(tenantId)).allowedOrigins.includes("https://added.acme.com"));
assert(!(await repo.getTenant(tenantId))?.allowedOrigins.includes("https://added.acme.com"));
assert(!renderToStaticMarkup(await GoLivePage()).includes("https://added.acme.com"));
assert.deepEqual(revalidatedPaths, ["/dashboard", "/dashboard/origins", "/dashboard/go-live"]);

const pendingHomeHtml = renderToStaticMarkup(await DashboardPage({ searchParams: Promise.resolve({}) }));
const checklistHtml = pendingHomeHtml.match(/<section[^>]*>.*?<div[^>]*>Get live<\/div>.*?<\/section>/)?.[0];
assert(checklistHtml);
assert(checklistHtml.includes("Write your guide"));
assert(checklistHtml.includes("Put Skilly on your site"));
assert(checklistHtml.includes("First real conversation"));
assert.equal((checklistHtml.match(/class="block transition-colors/g) ?? []).length, 3);
assert(pendingHomeHtml.indexOf("Get live</div>") < pendingHomeHtml.indexOf("setup checks left"));
assert(pendingHomeHtml.includes('href="/dashboard/go-live"'));
assert(!pendingHomeHtml.includes("/dashboard/setup#"));

await repo.recordProjectWidgetSeen(project.id, "app.acme.com");
const installedHtml = renderToStaticMarkup(await GoLivePage());
assert(installedHtml.includes("Installed on app.acme.com. Open your site and ask Skilly one question."));
assert(installedHtml.includes("Pick a plan to keep Skilly on"));
assert(!installedHtml.includes("Waiting for Skilly"));
await repo.recordUsage({ tenantId, kind: "session_seconds", seconds: 20, domain: "app.acme.com" });
const liveHtml = renderToStaticMarkup(await GoLivePage());
assert(liveHtml.includes("Skilly is live on app.acme.com."));
assert(liveHtml.includes("4/4"));
assert(!renderToStaticMarkup(await DashboardPage({ searchParams: Promise.resolve({}) })).includes("Get live</div>"));

for (const key of await repo.listApiKeys(tenantId)) await repo.revokeApiKey(tenantId, key.id);
const noKeyHtml = renderToStaticMarkup(await GoLivePage());
assert(noKeyHtml.includes("pk_live_your_key"));
assert(noKeyHtml.includes('href="/dashboard/keys"'));
assert(noKeyHtml.includes("Create a publishable key"));
const guideHtml = renderToStaticMarkup(await SetupPage());
assert(guideHtml.includes("Teach Skilly your product."));
assert(guideHtml.includes('href="#teach"'));
assert(guideHtml.includes('href="#style"'));
for (const removedStep of ["allow", "install", "test"]) assert(!guideHtml.includes(`id="${removedStep}"`));
assert(guideHtml.includes("Next: put Skilly on your site"));
assert(guideHtml.includes('data-analytics-event="dashboard_guide_next_clicked"'));
assert(guideHtml.includes("Try it first"));
assert.equal((guideHtml.match(/bg-accent text-accent-fg border border-line shadow-card hover:bg-accent-hover/g) ?? []).length, 1);
const usageHtml = renderToStaticMarkup(await UsagePage());
assert(usageHtml.includes('data-analytics-event="dashboard_portal_clicked"'));
for (const planName of ["Starter", "Studio", "Scale"]) assert(usageHtml.includes(planName));

const shellProps = {
  children: null,
  tenantName: "Acme",
  role: "tenant_admin",
  accountEmail: "builder@acme.com",
  needsSetup: true,
  isLive: false,
  switchableTenants: [],
  currentTenantId: tenantId,
  readinessCompleted: 2,
  readinessTotal: 4,
  usedSecondsThisMonth: 0,
  usageCapSeconds: 0,
  hasPeopleSurface: true,
} satisfies Parameters<typeof AppShell>[0];
const shellHtml = renderToStaticMarkup(createElement(AppShell, shellProps));
const navigation = shellHtml.match(/<nav aria-label="Primary"[^>]*>(.*?)<\/nav>/)?.[1];
assert(navigation);
assert.deepEqual([...navigation.matchAll(/data-analytics-label="([^"]+)"/g)].map((match) => match[1]), [
  "Home", "Guide", "Try it", "Go live", "Usage &amp; plan", "Settings",
]);
assert(!navigation.includes("Tenant directory"));
assert(shellHtml.includes("Book a free setup call"));
assert(shellHtml.includes("2/4 checks"));
assert(renderToStaticMarkup(createElement(AppShell, { ...shellProps, role: "super_admin" })).includes("Tenant directory"));
pathname = "/dashboard/setup";
assert(renderToStaticMarkup(createElement(AppShell, shellProps)).includes('<strong class="font-bold text-fg">Guide</strong>'));
pathname = "/dashboard/people";
const peopleHtml = renderToStaticMarkup(createElement(AppShell, shellProps));
assert(peopleHtml.includes('data-analytics-label="Create a skill"'));
assert(peopleHtml.includes('data-analytics-label="My skills"'));
assert(peopleHtml.includes('data-analytics-label="Account"'));
assert(!peopleHtml.includes('data-analytics-label="Go live"'));

console.log("Go live, Home, Guide, Usage, and builder/People navigation rendered successfully.");
