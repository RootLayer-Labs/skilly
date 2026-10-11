"use client";

import { useActionState, useState } from "react";
import { Button, Field, Panel, PanelBody } from "@/app/dashboard/v2";
import { draftGuideAction } from "./actions";

const taskOptions = ["Create first project", "Connect data", "Invite a teammate", "Publish first page", "Something else…"];

export function StartForm({ productUrl, replacesGuide }: { productUrl: string; replacesGuide: boolean }) {
  const [selectedTask, setSelectedTask] = useState(taskOptions[0] ?? "Create first project");
  const [state, action, pending] = useActionState(draftGuideAction, {});
  const customTask = selectedTask === "Something else…";
  return (
    <Panel>
      <PanelBody className="p-6 sm:p-7">
        <form action={action} className="space-y-6">
          <fieldset disabled={pending} className="min-w-0 space-y-6 disabled:opacity-70">
            <Field name="productUrl" label="Your product's URL" type="url" defaultValue={productUrl} placeholder="https://app.yourproduct.com" mono maxLength={2048} helper="Skilly reads your public pages and docs. A login-only app works too: you'll teach the inside in the next step." />
            <fieldset className="space-y-3">
              <legend className="text-xs font-bold text-fg-muted">What should a new user get done first?</legend>
              <div className="flex flex-wrap gap-2">
                {taskOptions.map((task) => <label key={task} className={`cursor-pointer rounded-full border px-4 py-2.5 text-sm font-semibold transition focus-within:ring-[3px] focus-within:ring-accent-line ${selectedTask === task ? "border-accent-line bg-accent-soft text-accent-text" : "border-line bg-surface text-fg-muted hover:bg-surface-strong"}`}>
                  <input className="sr-only" type="radio" name="taskChoice" value={task} checked={selectedTask === task} onChange={() => setSelectedTask(task)} />
                  {task}
                </label>)}
              </div>
              {customTask ? <Field name="firstTask" label="Describe the first task" placeholder="Set up their first report" maxLength={100} /> : <input type="hidden" name="firstTask" value={selectedTask} />}
            </fieldset>
            <Field name="docsUrl" label="Help docs URL (optional)" type="url" placeholder="https://docs.yourproduct.com" maxLength={2048} />
            {replacesGuide && <p className="rounded-[10px] border border-accent-line bg-accent-soft px-3 py-2 text-sm text-accent-text">This replaces your current guide.</p>}
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" className="h-11 px-5" disabled={pending} analyticsEvent="studio_guide_draft_clicked">{pending ? "Drafting your guide…" : "Draft my guide →"}</Button>
              <p className="text-xs text-fg-subtle">Nothing is installed yet. No card needed.</p>
            </div>
          </fieldset>
          <div aria-live="polite">
            {pending && <p className="text-sm text-fg-muted">Drafting your guide… this takes about 20 seconds</p>}
            {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
          </div>
        </form>
      </PanelBody>
    </Panel>
  );
}
