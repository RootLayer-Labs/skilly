import { describe, expect, test } from "bun:test";
import { parseStudioGuide, serializeStudioGuide, type StudioGuide } from "../src/domain/studioGuide";

const guide: StudioGuide = {
  productName: "Brightpath",
  intro: "Help users make sense of their data.\n\nGuide them one step at a time.",
  tone: "friendly",
  facts: ["Brightpath connects to payments, email and CRM tools.", "The dashboard stays empty until one source is connected."],
  tasks: [
    { title: "Connect your data", goal: "User connects their first data source", userQuestions: ["How do I connect my data?", "Why is my dashboard empty?"], steps: [{ say: "Open Integrations in the left sidebar.", pointsAt: "Sidebar > Integrations" }, { say: "Connect your account. I'll wait here.", pointsAt: "" }] },
    { title: "Invite a teammate", goal: "User sends their first invitation", userQuestions: ["How do I invite someone?"], steps: [{ say: "Open Team and choose Invite.", pointsAt: "Settings > Team > Invite" }] },
  ],
};

describe("Studio guide markdown", () => {
  test("round trips two tasks with intro paragraphs, facts and optional pointing", () => {
    expect(parseStudioGuide(serializeStudioGuide(guide))).toEqual({ ok: true, guide });
  });

  test("serializes the readable Studio shape", () => {
    expect(serializeStudioGuide({ productName: "Acme", intro: "Help new users.", tone: "concise", facts: ["Projects contain tasks."], tasks: [{ title: "Create a project", goal: "Create first project", userQuestions: ["How do I start?"], steps: [{ say: "Choose New project.", pointsAt: "Sidebar > New project" }, { say: "Give it a name.", pointsAt: "" }] }] })).toBe("# Acme guide\n\nHelp new users.\n\n## How Skilly sounds\nConcise. Answer in the user's language.\n\n## What Skilly should know\n- Projects contain tasks.\n\n## Task: Create a project\nGoal: Create first project\n\nUsers ask things like:\n- \"How do I start?\"\n\nSteps:\n1. Choose New project. (points at: Sidebar > New project)\n2. Give it a name.\n");
  });

  test("keeps a demo title and plain paragraphs", () => {
    expect(parseStudioGuide("# Acme Onboarding\n\nGuide the user through setting up their first project.")).toEqual({ ok: true, guide: { productName: "Acme Onboarding", intro: "Guide the user through setting up their first project.", tone: "friendly", facts: [], tasks: [] } });
    expect(parseStudioGuide("# Acme guide\n\nKeep this title.")).toEqual({ ok: true, guide: { productName: "Acme guide", intro: "Keep this title.", tone: "friendly", facts: [], tasks: [] } });
  });

  test("defaults missing sections and tolerates blank lines and asterisk bullets", () => {
    expect(parseStudioGuide("\n# Acme guide\n\n\n## What Skilly should know\n\n* Projects contain tasks.\n\n## Task: Start\n\nUsers ask things like:\n\n* \"How?\"\n\nSteps:\n\n1. Choose New.\n\n")).toEqual({ ok: true, guide: { productName: "Acme", intro: "", tone: "friendly", facts: ["Projects contain tasks."], tasks: [{ title: "Start", goal: "", userQuestions: ["How?"], steps: [{ say: "Choose New.", pointsAt: "" }] }] } });
    expect(parseStudioGuide("# Acme guide\n\n## Task: Start")).toEqual({ ok: true, guide: { productName: "Acme", intro: "", tone: "friendly", facts: [], tasks: [{ title: "Start", goal: "", userQuestions: [], steps: [] }] } });
  });

  test("a step without a pointing suffix has empty pointsAt", () => {
    expect(parseStudioGuide("# Acme guide\n\n## Task: Start\nSteps:\n1. Choose New.")).toEqual({ ok: true, guide: { productName: "Acme", intro: "", tone: "friendly", facts: [], tasks: [{ title: "Start", goal: "", userQuestions: [], steps: [{ say: "Choose New.", pointsAt: "" }] }] } });
  });

  test("unknown headings and frontmatter use the raw editor", () => {
    expect(parseStudioGuide("# Acme\n\n## Custom instructions\nKeep this text.").ok).toBe(false);
    expect(parseStudioGuide("---\nname: Acme\n---\n\n# Acme").ok).toBe(false);
  });

  test("rejects text outside the steps list and other unsupported instructions", () => {
    for (const content of ["# Acme guide\n\n## Task: Start\nSteps:\n1. Choose New.\nDo not lose this note.", "# Acme guide\n\n## Task: Start\nCustom task text.", "# Acme guide\n\n## How Skilly sounds\nBe clever.", "# Acme\n\n### Other heading\nKeep it.", "Instructions without a title"]) expect(parseStudioGuide(content).ok).toBe(false);
  });

  test("new projects with empty content start with an empty guide", () => {
    expect(parseStudioGuide(" \n\t\n")).toEqual({ ok: true, guide: { productName: "", intro: "", tone: "friendly", facts: [], tasks: [] } });
  });

  test("escapes delimiter collisions, newlines and empty field values losslessly", () => {
    const unusualGuide: StudioGuide = { productName: "Acme guide\n# title", intro: "\n## A paragraph, not a section\nLiteral \\n text\n", tone: "formal", facts: ["", "Line one\nLine two", "C:\\new\\folder"], tasks: [{ title: "", goal: "Goal:\nMore", userQuestions: ["", 'Say "hello" (please).'], steps: [{ say: "Literal (points at: example)", pointsAt: "" }, { say: "", pointsAt: "Menu (top)\nNext" }] }] };
    expect(parseStudioGuide(serializeStudioGuide(unusualGuide))).toEqual({ ok: true, guide: unusualGuide });
  });

  test("preserves JavaScript line separators in every field", () => {
    for (const text of ["\u2028", "\u2029"]) {
      const separatorGuide: StudioGuide = { productName: text, intro: text, tone: "formal", facts: [text], tasks: [{ title: text, goal: text, userQuestions: [text], steps: [{ say: text, pointsAt: text }] }] };
      expect(parseStudioGuide(serializeStudioGuide(separatorGuide))).toEqual({ ok: true, guide: separatorGuide });
    }
  });

  test("preserves whitespace-only and boundary-whitespace intros", () => {
    for (const intro of ["   ", " \nParagraph\n ", "\n\nParagraph\n\n", "\t\n\t", "\v\f\u00a0"]) {
      const whitespaceGuide = { ...guide, intro };
      expect(parseStudioGuide(serializeStudioGuide(whitespaceGuide))).toEqual({ ok: true, guide: whitespaceGuide });
    }
  });
});
