export interface StudioGuideStep {
  say: string;
  pointsAt: string;
}

export interface StudioGuideTask {
  title: string;
  goal: string;
  userQuestions: string[];
  steps: StudioGuideStep[];
}

export interface StudioGuide {
  productName: string;
  intro: string;
  tone: "friendly" | "concise" | "formal";
  facts: string[];
  tasks: StudioGuideTask[];
}

const tones: StudioGuide["tone"][] = ["friendly", "concise", "formal"];

type ParseResult = { ok: true; guide: StudioGuide } | { ok: false; reason: string };

const toneSentences = {
  friendly: "Friendly. Answer in the user's language.",
  concise: "Concise. Answer in the user's language.",
  formal: "Formal. Answer in the user's language.",
} satisfies Record<StudioGuide["tone"], string>;

function encodeText(text: string): string {
  return text.replace(/[\\\n\r"()#\u2028\u2029]/g, (character) => {
    if (character === "\n") return "\\n";
    if (character === "\r") return "\\r";
    if (character === "\u2028" || character === "\u2029") return `\\u${character.charCodeAt(0).toString(16)}`;
    return `\\${character}`;
  });
}

function decodeText(text: string): string {
  return text.replace(/\\(?:([\\nr"()#])|u([0-9a-f]{4}))/g, (_match, character: string | undefined, codePoint: string | undefined) => {
    if (codePoint) return String.fromCharCode(Number.parseInt(codePoint, 16));
    if (character === "n") return "\n";
    if (character === "r") return "\r";
    return character ?? "";
  });
}

function encodeIntro(intro: string): string {
  return intro.split("\n").map((line) => line.trim() === "" ? encodeText(line).replace(/\s/g, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`) : encodeText(line)).join("\n")
    .replace(/^\n+|\n+$/g, (newlines) => "\\n".repeat(newlines.length));
}

export function serializeStudioGuide(guide: StudioGuide): string {
  const sections = [`# ${encodeText(guide.productName)} guide`];
  if (guide.intro !== "") sections.push(encodeIntro(guide.intro));
  sections.push(`## How Skilly sounds\n${toneSentences[guide.tone]}`);
  sections.push(["## What Skilly should know", ...guide.facts.map((fact) => `- ${encodeText(fact)}`)].join("\n"));
  for (const task of guide.tasks) {
    sections.push([
      `## Task: ${encodeText(task.title)}`,
      `Goal: ${encodeText(task.goal)}`,
      "",
      "Users ask things like:",
      ...task.userQuestions.map((question) => `- "${encodeText(question)}"`),
      "",
      "Steps:",
      ...task.steps.map((step, index) => `${index + 1}. ${encodeText(step.say)}${step.pointsAt === "" ? "" : ` (points at: ${encodeText(step.pointsAt)})`}`),
    ].join("\n"));
  }
  return `${sections.join("\n\n")}\n`;
}

export function parseStudioGuide(skillMarkdown: string): ParseResult {
  const lines = skillMarkdown.replace(/\r\n/g, "\n").split("\n");
  while (lines.length > 0 && lines[0]?.trim() === "") lines.shift();
  if (lines.length === 0) return { ok: true, guide: { productName: "", intro: "", tone: "friendly", facts: [], tasks: [] } };
  if (lines[0]?.trim() === "---") return { ok: false, reason: "Frontmatter needs the SKILL.md editor." };
  const title = lines.shift()?.match(/^# (.*)$/)?.[1];
  if (title === undefined) return { ok: false, reason: "The guide needs a single title." };

  const introLines: string[] = [];
  const sections: Array<{ heading: string; lines: string[] }> = [];
  for (const line of lines) {
    if (line.startsWith("## ")) sections.push({ heading: line.slice(3), lines: [] });
    else if (/^#+(?:\s|$)/.test(line)) return { ok: false, reason: "This heading needs the SKILL.md editor." };
    else {
      const section = sections.at(-1);
      if (section) section.lines.push(line);
      else introLines.push(line);
    }
  }
  while (introLines[0]?.trim() === "") introLines.shift();
  while (introLines.at(-1)?.trim() === "") introLines.pop();
  const structured = sections.length > 0;
  const guide: StudioGuide = {
    productName: structured ? decodeText(title.replace(/ guide$/, "")) : title,
    intro: structured ? decodeText(introLines.join("\n")) : introLines.join("\n"),
    tone: "friendly",
    facts: [],
    tasks: [],
  };
  const seenSections = new Set<string>();
  for (const section of sections) {
    const contentLines = section.lines.filter((line) => line.trim() !== "");
    if (section.heading === "How Skilly sounds") {
      if (seenSections.has(section.heading)) return { ok: false, reason: "Repeated tone sections need the SKILL.md editor." };
      seenSections.add(section.heading);
      if (contentLines.length === 0) continue;
      const tone = tones.find((candidate) => toneSentences[candidate] === contentLines.join("\n"));
      if (!tone) return { ok: false, reason: "Custom tone instructions need the SKILL.md editor." };
      guide.tone = tone;
    } else if (section.heading === "What Skilly should know") {
      if (seenSections.has(section.heading)) return { ok: false, reason: "Repeated fact sections need the SKILL.md editor." };
      seenSections.add(section.heading);
      for (const line of contentLines) {
        const fact = line.match(/^[*-] (.*)$/)?.[1];
        if (fact === undefined) return { ok: false, reason: "Facts must be a bullet list." };
        guide.facts.push(decodeText(fact));
      }
    } else if (section.heading.startsWith("Task: ")) {
      const task: StudioGuideTask = { title: decodeText(section.heading.slice(6)), goal: "", userQuestions: [], steps: [] };
      let taskSection: "details" | "questions" | "steps" = "details";
      let hasGoal = false;
      for (const line of contentLines) {
        if (taskSection === "details" && line.startsWith("Goal: ") && !hasGoal) {
          task.goal = decodeText(line.slice(6));
          hasGoal = true;
        } else if (line === "Users ask things like:" && taskSection === "details") taskSection = "questions";
        else if (line === "Steps:" && taskSection !== "steps") taskSection = "steps";
        else if (taskSection === "questions") {
          const question = line.match(/^[*-] "(.*)"$/)?.[1];
          if (question === undefined) return { ok: false, reason: "User questions must be quoted bullets." };
          task.userQuestions.push(decodeText(question));
        } else if (taskSection === "steps") {
          const stepText = line.match(/^\d+\. (.*)$/)?.[1];
          if (stepText === undefined) return { ok: false, reason: "Text outside the steps list needs the SKILL.md editor." };
          const pointingSuffix = stepText.match(/ \(points at: (.*)\)$/);
          task.steps.push({ say: decodeText(pointingSuffix ? stepText.slice(0, pointingSuffix.index) : stepText), pointsAt: decodeText(pointingSuffix?.[1] ?? "") });
        } else return { ok: false, reason: "Custom task instructions need the SKILL.md editor." };
      }
      guide.tasks.push(task);
    } else return { ok: false, reason: `Unknown section "${section.heading}" needs the SKILL.md editor.` };
  }
  return { ok: true, guide };
}
