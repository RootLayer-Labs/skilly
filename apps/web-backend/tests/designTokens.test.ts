import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// Studio UI must use the semantic color tokens defined in src/app/globals.css
// (bg-surface, text-fg-muted, border-line, bg-accent, ...). Literal colors and
// Tailwind palette classes only work in one theme, which is how Studio ended up
// dark-only with ~500 hard-coded colors.

const backendRoot = join(import.meta.dir, "..");
const appRoot = join(backendRoot, "src/app");

// Theme values live here and nowhere else. API routes render no UI.
const excludedPaths = new Set(["src/app/globals.css"]);
const excludedDirectories = ["src/app/api/"];

const literalColorPatterns: Array<{ name: string; pattern: RegExp }> = [
  { name: "hex color", pattern: /#[0-9a-fA-F]{3,8}\b(?![-\w])/g },
  { name: "rgb()/hsl() color", pattern: /(?:rgba?|hsla?)\(/g },
  {
    name: "Tailwind palette class",
    pattern:
      /\b(?:bg|text|border|ring|ring-offset|from|via|to|fill|stroke|outline|divide|placeholder|caret|accent|decoration|shadow)-(?:white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?\b/g,
  },
];

function collectUiFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    const repoRelativePath = relative(backendRoot, fullPath);
    if (statSync(fullPath).isDirectory()) {
      return excludedDirectories.some((excluded) => `${repoRelativePath}/`.startsWith(excluded))
        ? []
        : collectUiFiles(fullPath);
    }
    if (!/\.(tsx?|css)$/.test(entry) || excludedPaths.has(repoRelativePath)) return [];
    return [fullPath];
  });
}

function findLiteralColors(source: string): string[] {
  const findings: string[] = [];
  source.split("\n").forEach((line, lineIndex) => {
    for (const { name, pattern } of literalColorPatterns) {
      for (const match of line.matchAll(pattern)) {
        findings.push(`line ${lineIndex + 1}: ${name} "${match[0]}"`);
      }
    }
  });
  return findings;
}

describe("Studio design tokens", () => {
  test("UI code uses semantic color tokens, never literal or palette colors", () => {
    const violations = collectUiFiles(appRoot).flatMap((filePath) =>
      findLiteralColors(readFileSync(filePath, "utf8")).map(
        (finding) => `${relative(backendRoot, filePath)} ${finding}`,
      ),
    );

    expect(violations).toEqual([]);
  });

  test("light is the default theme and dark is opt-in", () => {
    const globals = readFileSync(join(appRoot, "globals.css"), "utf8");

    expect(globals).toContain("--color-*: initial;");
    expect(globals).toMatch(/:root\s*{\s*color-scheme: light;/);
    expect(globals).toMatch(/\[data-theme="dark"\]\s*{\s*color-scheme: dark;/);
  });

  test("the guard catches the colors it is meant to ban", () => {
    expect(findLiteralColors('className="text-gray-100 bg-white/[0.035]"')).toHaveLength(2);
    expect(findLiteralColors('style={{ color: "#f50a87" }}')).toHaveLength(1);
    expect(findLiteralColors('className="shadow-[0_8px_24px_rgba(0,0,0,0.3)]"')).toHaveLength(1);
    expect(findLiteralColors('className="bg-surface text-fg-muted border-line"')).toHaveLength(0);
  });
});
