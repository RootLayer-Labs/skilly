import { getRepo } from "@/db";
import { getDashboardProjectSelection } from "@/lib/dashboardProject";
import { Panel, PanelBody } from "@/app/dashboard/v2";
import { StartForm } from "./StartForm";

const steps = ["Draft your guide", "Try it on your site", "Go live"];
const nextSteps = [
  { title: "Skilly drafts the guide", description: "Steps, buttons to point at, and what to say. You review it in plain language, not markdown." },
  { title: "Talk to it on your own site", description: "A live preview with the widget on top. No code, no domain setup." },
  { title: "Go live when you're happy", description: "Paste one script tag that already has your key in it, and pick a plan." },
];

export default async function StartPage() {
  const repo = getRepo();
  const { tenantId, project } = await getDashboardProjectSelection(repo);
  const tenant = await repo.getTenant(tenantId);
  const productUrl = project.allowedOrigins[0] ?? tenant?.allowedOrigins[0] ?? "";
  return (
    <div className="space-y-8">
      <ol aria-label="Getting started" className="flex flex-wrap gap-2">
        {steps.map((step, index) => <li key={step} aria-current={index === 0 ? "step" : undefined} className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold ${index === 0 ? "border-accent-line bg-accent-soft text-accent-text" : "border-line bg-surface text-fg-muted"}`}>
          <span className={`grid h-6 w-6 place-items-center rounded-full ${index === 0 ? "bg-accent text-accent-fg" : "bg-surface-strong text-fg-subtle"}`}>{index + 1}</span>{step}
        </li>)}
      </ol>
      <div>
        <h1 className="text-3xl font-bold tracking-[-0.035em] text-fg sm:text-4xl">Let's get Skilly talking on your product.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-fg-muted sm:text-base">Give us your product's URL and the first thing a new user should get done. Skilly drafts the guide. You can try it on your own site before installing anything.</p>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(250px,3fr)]">
        <StartForm productUrl={productUrl} replacesGuide={project.skillContent.trim().length > 0} />
        <aside className="space-y-3">
          <h2 className="font-mono text-xs font-bold uppercase tracking-wide text-fg-subtle">What happens next</h2>
          {nextSteps.map((step, index) => <Panel key={step.title}><PanelBody className="flex gap-3 p-4">
            <span className="font-mono text-xs font-bold text-accent-text">{String(index + 1).padStart(2, "0")}</span>
            <div><h3 className="text-sm font-bold text-fg">{step.title}</h3><p className="mt-1 text-xs leading-5 text-fg-muted">{step.description}</p></div>
          </PanelBody></Panel>)}
        </aside>
      </div>
    </div>
  );
}
