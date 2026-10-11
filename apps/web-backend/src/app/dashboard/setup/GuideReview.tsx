"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { serializeStudioGuide, type StudioGuide, type StudioGuideTask } from "@/domain/studioGuide";
import { validateSkillContent } from "@/domain/skillValidation";
import { saveSkillAction, type SaveSkillState } from "../actions";
import { Button, ButtonLink, Field, PageHeader, Panel, PanelBody, PanelHeader, StatusPill } from "../v2";

function GuideField({ label, name, value, placeholder, onChange }: {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div onChange={(event) => {
      if (event.target instanceof HTMLInputElement) onChange(event.target.value);
    }}>
      <Field label={label} name={name} defaultValue={value} placeholder={placeholder} />
    </div>
  );
}

const tones: Array<{ value: StudioGuide["tone"]; label: string }> = [
  { value: "friendly", label: "Friendly" },
  { value: "concise", label: "Concise" },
  { value: "formal", label: "Formal" },
];
const starterTasks = ["Create first project", "Connect data", "Invite a teammate", "Something else…"];

export function GuideReview({ initialGuide }: { initialGuide: StudioGuide }) {
  const router = useRouter();
  const [guide, setGuide] = useState(initialGuide);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
  const [fieldsRevision, setFieldsRevision] = useState(0);
  const [questionDraft, setQuestionDraft] = useState("");
  const submissionIntentInput = useRef<HTMLInputElement>(null);
  const [saveState, save, saving] = useActionState<SaveSkillState, FormData>(async (previousState, formData) => {
    const shouldTryOnSite = formData.get("intent") === "try";
    const result = await saveSkillAction(previousState, formData);
    if (result.ok && shouldTryOnSite) router.push("/dashboard/widget");
    return result;
  }, {});
  const serializedGuide = serializeStudioGuide(guide);
  const validation = validateSkillContent(serializedGuide);
  const selectedTask = guide.tasks[selectedTaskIndex];

  function updateTask(update: (task: StudioGuideTask) => StudioGuideTask) {
    setGuide((currentGuide) => ({ ...currentGuide, tasks: currentGuide.tasks.map((task, index) => index === selectedTaskIndex ? update(task) : task) }));
  }

  function addTask(title: string) {
    setGuide((currentGuide) => ({ ...currentGuide, tasks: [...currentGuide.tasks, { title, goal: "", userQuestions: [], steps: [] }] }));
    setSelectedTaskIndex(guide.tasks.length);
    setQuestionDraft("");
  }

  function addQuestion() {
    const question = questionDraft.trim();
    if (!question) return;
    updateTask((task) => ({ ...task, userQuestions: [...task.userQuestions, question] }));
    setQuestionDraft("");
  }

  function moveStep(stepIndex: number, direction: -1 | 1) {
    updateTask((task) => {
      const steps = [...task.steps];
      const step = steps[stepIndex];
      const destination = stepIndex + direction;
      if (!step || destination < 0 || destination >= steps.length) return task;
      steps.splice(stepIndex, 1);
      steps.splice(destination, 0, step);
      return { ...task, steps };
    });
    setFieldsRevision((revision) => revision + 1);
  }

  return (
    <form action={save} onSubmit={(event) => {
      const submitter = event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : null;
      if (submissionIntentInput.current) submissionIntentInput.current.value = submitter?.getAttribute("data-analytics-event") === "dashboard_guide_save_and_try_clicked" ? "try" : "save";
    }}>
      <input type="hidden" name="content" value={serializedGuide} />
      <input ref={submissionIntentInput} type="hidden" name="intent" defaultValue="save" />
      <PageHeader
        eyebrow="Step 1 of 3 · Your guide"
        title="Here's the guide Skilly follows."
        description="Check what Skilly will say and point at. Plain language — no markdown needed."
        action={<div className="flex flex-wrap items-center gap-3">
          <StatusPill tone={validation.ok ? "green" : "red"} label={validation.ok ? "✓ Safety check passed" : validation.issues[0]} className="h-auto min-h-[26px] py-1" />
          <ButtonLink href="/dashboard/skill">Edit as SKILL.md</ButtonLink>
        </div>}
      />
      <fieldset disabled={saving} className="min-w-0 space-y-5 disabled:opacity-70">
        <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-fg-muted">Tasks Skilly can guide</h2>
            <div className="space-y-2">
              {guide.tasks.map((task, taskIndex) => (
                <button
                  key={taskIndex}
                  type="button"
                  aria-pressed={selectedTaskIndex === taskIndex}
                  onClick={() => { setSelectedTaskIndex(taskIndex); setQuestionDraft(""); }}
                  className={`w-full rounded-[14px] border p-4 text-left transition ${selectedTaskIndex === taskIndex ? "border-accent-line bg-accent-soft" : "border-line bg-surface hover:bg-surface-strong"}`}
                >
                  <span className="block text-sm font-bold text-fg">{task.title || "Untitled task"}</span>
                  <span className="mt-1 block text-xs text-fg-muted">{task.steps.length} {task.steps.length === 1 ? "step" : "steps"}</span>
                </button>
              ))}
              {guide.tasks.length === 0 && <p className="py-2 text-sm leading-relaxed text-fg-muted">Add your first task to give Skilly a clear place to start.</p>}
              <Button type="button" className="w-full border-dashed" analyticsEvent="dashboard_guide_task_added" onClick={() => addTask("New task")}>+ Add a task</Button>
            </div>
          </aside>
          <div className="min-w-0 space-y-5">
            {selectedTask ? <>
              <Panel>
                <PanelBody className="space-y-5" key={`${selectedTaskIndex}-${fieldsRevision}`}>
                  <div className="grid gap-4 xl:grid-cols-2">
                    <GuideField label="Task title" name="taskTitle" value={selectedTask.title} onChange={(title) => updateTask((task) => ({ ...task, title }))} />
                    <GuideField label="Goal" name="taskGoal" value={selectedTask.goal} placeholder="User connects their first data source" onChange={(goal) => updateTask((task) => ({ ...task, goal }))} />
                  </div>
                  <div>
                    <h2 className="mb-3 text-sm font-bold text-fg">Skilly steps in when users ask things like</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedTask.userQuestions.map((question, questionIndex) => <span key={questionIndex} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-sunken py-1 pl-3 pr-1 text-sm text-fg">
                        {question}
                        <button type="button" aria-label={`Remove question ${questionIndex + 1}: ${question}`} className="rounded-full px-2 py-1 text-fg-muted hover:bg-surface-strong" onClick={() => updateTask((task) => ({ ...task, userQuestions: task.userQuestions.filter((_question, index) => index !== questionIndex) }))}>×</button>
                      </span>)}
                      <label className="sr-only" htmlFor="new-user-question">Add a user question</label>
                      <input id="new-user-question" value={questionDraft} onChange={(event) => setQuestionDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addQuestion(); } }} placeholder="How do I connect my data?" className="min-w-0 flex-1 rounded-[10px] border border-line bg-surface-sunken px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-subtle focus:border-accent-line focus:ring-[3px] focus:ring-accent-line" />
                      <Button type="button" variant="ghost" onClick={addQuestion} disabled={!questionDraft.trim()}>+ Add</Button>
                    </div>
                  </div>
                </PanelBody>
              </Panel>
              <Panel>
                <PanelHeader title="Steps" description="What Skilly says and where it points" />
                <PanelBody className="space-y-4" key={`${selectedTaskIndex}-${fieldsRevision}`}>
                  {selectedTask.steps.length === 0 && <p className="text-sm text-fg-muted">Add the first thing Skilly should say to help the user reach this goal.</p>}
                  {selectedTask.steps.map((step, stepIndex) => <div key={stepIndex} className="flex gap-3 border-b border-line-soft pb-4">
                    <span className="pt-7 font-mono text-xs text-fg-subtle">{String(stepIndex + 1).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1 space-y-3">
                      <GuideField label="What Skilly says" name={`stepSay${stepIndex}`} value={step.say} placeholder="Open Integrations in the left sidebar. I'll point to it." onChange={(say) => updateTask((task) => ({ ...task, steps: task.steps.map((currentStep, index) => index === stepIndex ? { ...currentStep, say } : currentStep) }))} />
                      <div className="grid items-end gap-2 xl:grid-cols-[minmax(0,1fr)_auto]">
                        <GuideField label="Points at (optional)" name={`stepPointsAt${stepIndex}`} value={step.pointsAt} placeholder="Sidebar > Integrations" onChange={(pointsAt) => updateTask((task) => ({ ...task, steps: task.steps.map((currentStep, index) => index === stepIndex ? { ...currentStep, pointsAt } : currentStep) }))} />
                        <div className="flex flex-wrap gap-1">
                          <Button type="button" variant="ghost" disabled={stepIndex === 0} onClick={() => moveStep(stepIndex, -1)}>Move up</Button>
                          <Button type="button" variant="ghost" disabled={stepIndex === selectedTask.steps.length - 1} onClick={() => moveStep(stepIndex, 1)}>Move down</Button>
                          <Button type="button" variant="ghost" onClick={() => { updateTask((task) => ({ ...task, steps: task.steps.filter((_step, index) => index !== stepIndex) })); setFieldsRevision((revision) => revision + 1); }}>Remove step {stepIndex + 1}</Button>
                        </div>
                      </div>
                    </div>
                  </div>)}
                  <Button type="button" variant="ghost" onClick={() => updateTask((task) => ({ ...task, steps: [...task.steps, { say: "", pointsAt: "" }] }))}>+ Add a step</Button>
                </PanelBody>
              </Panel>
            </> : <Panel>
              <PanelBody className="space-y-5 py-10">
                <h2 className="text-lg font-bold text-fg">What should a new user get done first?</h2>
                <p className="text-sm text-fg-muted">Pick a starting point, then write the steps in your own words.</p>
                <ButtonLink href="/onboarding/start" variant="secondary">Draft it from my site</ButtonLink>
                <div className="flex flex-wrap gap-2">{starterTasks.map((title) => <Button key={title} type="button" analyticsEvent="dashboard_guide_task_added" onClick={() => addTask(title)}>{title}</Button>)}</div>
              </PanelBody>
            </Panel>}
            <div className="grid gap-5 xl:grid-cols-2">
              <Panel>
                <PanelHeader title="What Skilly should know" />
                <PanelBody className="space-y-3" key={fieldsRevision}>
                  {guide.facts.length === 0 && <p className="text-sm text-fg-muted">Add useful product details Skilly should remember.</p>}
                  <ul className="space-y-3">{guide.facts.map((fact, factIndex) => <li key={factIndex} className="flex items-end gap-2">
                    <span className="pb-3 text-fg-muted" aria-hidden="true">•</span>
                    <div className="min-w-0 flex-1"><GuideField label={`Fact ${factIndex + 1}`} name={`fact${factIndex}`} value={fact} onChange={(value) => setGuide((currentGuide) => ({ ...currentGuide, facts: currentGuide.facts.map((currentFact, index) => index === factIndex ? value : currentFact) }))} /></div>
                    <Button type="button" variant="ghost" onClick={() => { setGuide((currentGuide) => ({ ...currentGuide, facts: currentGuide.facts.filter((_fact, index) => index !== factIndex) })); setFieldsRevision((revision) => revision + 1); }}>Remove fact {factIndex + 1}</Button>
                  </li>)}</ul>
                  <Button type="button" variant="ghost" onClick={() => setGuide((currentGuide) => ({ ...currentGuide, facts: [...currentGuide.facts, ""] }))}>+ Add a fact</Button>
                </PanelBody>
              </Panel>
              <Panel>
                <PanelHeader title="How Skilly sounds" />
                <PanelBody className="space-y-4">
                  <div className="flex flex-wrap gap-2" role="group" aria-label="How Skilly sounds">{tones.map((tone) => <button key={tone.value} type="button" aria-pressed={guide.tone === tone.value} onClick={() => setGuide((currentGuide) => ({ ...currentGuide, tone: tone.value }))} className={`rounded-[9px] border px-3 py-2 text-sm font-bold transition ${guide.tone === tone.value ? "border-accent-line bg-accent-soft text-accent-text" : "border-line bg-surface text-fg-muted hover:bg-surface-strong"}`}>{tone.label}</button>)}</div>
                  <p className="text-xs leading-relaxed text-fg-muted">Language: automatically matches the user's language</p>
                </PanelBody>
              </Panel>
            </div>
          </div>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
          <p className="text-sm text-fg-muted">Save your guide, then try what Skilly says on your site.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button analyticsEvent="dashboard_guide_saved_clicked" variant="secondary" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            <Button analyticsEvent="dashboard_guide_save_and_try_clicked" variant="primary" disabled={saving}>{saving ? "Saving…" : "Save and try it on your site →"}</Button>
          </div>
        </footer>
      </fieldset>
      <div aria-live="polite" className="mt-3">
        {saveState.ok && <p className="text-sm font-bold text-success">Guide saved.</p>}
        {saveState.issues && saveState.issues.length > 0 && <ul className="space-y-1 rounded-[12px] border border-danger-line bg-danger-soft p-3 text-sm text-danger">{saveState.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}
      </div>
    </form>
  );
}
