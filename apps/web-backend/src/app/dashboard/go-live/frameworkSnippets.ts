import { buildInstallSnippet } from "@/lib/installSnippet";

type InstallSnippetInput = Parameters<typeof buildInstallSnippet>[0];
export type InstallFramework = "html" | "react" | "nextjs";

export const INSTALL_FRAMEWORKS: Array<{ id: InstallFramework; label: string; instruction: string }> = [
  { id: "html", label: "HTML", instruction: "Paste it just before </body>." },
  { id: "react", label: "React", instruction: "Mount this component once in your app." },
  { id: "nextjs", label: "Next.js", instruction: "Add this component to your root layout's body." },
];

function decodeAttribute(value: string): string {
  return value.replaceAll("&quot;", '"').replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
}

export function buildFrameworkSnippets(input: InstallSnippetInput): Record<InstallFramework, string> {
  const html = buildInstallSnippet(input);
  const attributes = Array.from(html.matchAll(/([\w-]+)="([^"]*)"/g), (match) => [match[1], decodeAttribute(match[2] ?? "")]);
  const reactAttributes = Object.fromEntries(attributes);
  const nextAttributes = attributes.map(([name, value]) => `      ${name}={${JSON.stringify(value)}}`).join("\n");

  return {
    html,
    react: `import { useEffect } from "react";\n\nexport function SkillyInstall() {\n  useEffect(() => {\n    const script = document.createElement("script");\n    const attributes = ${JSON.stringify(reactAttributes, null, 2).replaceAll("\n", "\n    ")};\n    for (const [name, value] of Object.entries(attributes)) {\n      script.setAttribute(name, value);\n    }\n    script.defer = true;\n    document.body.appendChild(script);\n    return () => script.remove();\n  }, []);\n  return null;\n}`,
    nextjs: `import Script from "next/script";\n\nexport function SkillyInstall() {\n  return (\n    <Script\n${nextAttributes}\n      strategy="afterInteractive"\n    />\n  );\n}`,
  };
}
