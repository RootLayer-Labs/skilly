"use client";

import { useActionState, useState } from "react";
import { saveSkillAction, type SaveSkillState } from "@/app/dashboard/actions";
import { Button } from "@/app/dashboard/v2";

/** Onboarding SKILL.md editor: template chips + mono editor + validate-and-save. */
export function OnboardingSkillEditor({
  initialContent,
  templates,
}: {
  initialContent: string;
  templates: Array<{ id: string; label: string; content: string }>;
}) {
  const [state, save, saving] = useActionState<SaveSkillState, FormData>(saveSkillAction, {});
  const [content, setContent] = useState(initialContent);

  return (
    <form action={save}>
      {/* Template selector — seeds the editor. */}
      <div className="mb-4 flex flex-wrap gap-2">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => setContent(template.content)}
            className="inline-flex h-8 items-center rounded-full border border-line bg-surface px-2.5 text-xs font-bold text-fg-muted transition hover:bg-surface-strong hover:text-fg"
          >
            {template.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[14px] border border-line bg-surface-sunken">
        <div className="flex h-[42px] items-center justify-between border-b border-line-soft px-3 text-fg-muted">
          <span className="font-mono text-xs">SKILL.md</span>
          <span className="text-xs">JetBrains Mono</span>
        </div>
        <textarea
          name="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={18}
          spellCheck={false}
          className="min-h-[420px] w-full resize-y border-0 bg-transparent p-4 font-mono text-[13px] leading-relaxed text-fg outline-none"
        />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button variant="primary" analyticsEvent="onboarding_skill_save" analyticsLabel="Validate and save" disabled={saving}>
          {saving ? "Validating…" : "Validate and save"}
        </Button>
        {state.ok && <span className="text-sm font-bold text-success">Saved</span>}
      </div>

      {state.issues && state.issues.length > 0 && (
        <ul className="mt-4 space-y-1 rounded-[12px] border border-danger-line bg-danger-soft p-3 text-sm text-danger">
          {state.issues.map((issue: string) => (
            <li key={issue}>• {issue}</li>
          ))}
        </ul>
      )}
    </form>
  );
}
