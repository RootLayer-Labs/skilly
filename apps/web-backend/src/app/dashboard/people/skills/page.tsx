import Link from "next/link";
import { listBundledSkills } from "@/lib/bundledSkills";
import { PageHeader, Panel, PanelBody, StatusPill } from "../../v2";

export const dynamic = "force-dynamic";

export default async function PeopleSkillsPage() {
  const skills = await listBundledSkills();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="For people"
        eyebrowTone="neutral"
        title="My skills"
        description="This page shows the bundled Skilly Mac app skills that are available today. Private user-created skills are intentionally not shown until their backend storage exists."
        action={
          <Link
            href="/dashboard/people"
            className="inline-flex h-[38px] items-center justify-center rounded-[9px] border border-people-line bg-people px-[13px] text-sm font-bold text-accent-fg shadow-card transition hover:bg-people/90 active:scale-[0.98]"
          >
            New skill
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {skills.map((skill) => (
          <Panel
            key={skill.id}
            id={skill.id}
            className={skill.id === "blender-fundamentals" ? "scroll-mt-8 border-accent-line" : "scroll-mt-8"}
          >
            <PanelBody>
              <div className="flex flex-wrap gap-2">
                <StatusPill tone="green" label="Bundled" />
                <StatusPill tone="neutral" label={skill.difficulty} />
              </div>
              <h2 className="mt-4 text-base font-extrabold tracking-[-0.02em] text-fg">{skill.name}</h2>
              <p className="mt-1 text-sm text-fg-muted">
                {skill.targetApp} · {skill.category} · {skill.estimatedHours}h · {skill.license}
              </p>
              <div className="mt-5 text-sm font-bold text-accent-text">Available in the Mac app</div>
            </PanelBody>
          </Panel>
        ))}
      </div>

      <Panel>
        <PanelBody>
          <div className="max-w-2xl">
            <h2 className="text-[15px] font-bold text-fg">Publishing gate</h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              Bundled skills come from the existing Skilly Mac app library. The UI does not expose private skill creation yet because the personal-skill backend, sharing, and review workflow still need to be added.
            </p>
          </div>
        </PanelBody>
      </Panel>
    </div>
  );
}
