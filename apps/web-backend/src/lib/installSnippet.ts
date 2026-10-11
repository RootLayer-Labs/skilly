import type { WidgetConfig } from "@/db/repo";

type InstallSnippetInput = {
  publishableKey: string;
  skillId: string;
  widgetConfig?: Pick<WidgetConfig, "accentColor" | "locale" | "launcherLabel">;
  includeRuntimeUrls?: boolean;
};

function escapeAttribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function buildInstallSnippet({ publishableKey, skillId, widgetConfig, includeRuntimeUrls = true }: InstallSnippetInput): string {
  const runtimeAttributes = includeRuntimeUrls
    ? `\n        data-skilly-backend-url="https://studio.tryskilly.app"\n        data-skilly-core-url="https://cdn.tryskilly.app/web/v1.0.0/skilly_core_web_sdk.js"`
    : "";
  const appearanceAttributes = widgetConfig
    ? `\n        data-skilly-accent="${escapeAttribute(widgetConfig.accentColor)}"\n        data-skilly-locale="${escapeAttribute(widgetConfig.locale)}"`
    : "";
  const launcherAttribute = widgetConfig?.launcherLabel
    ? `\n        data-skilly-launcher="${escapeAttribute(widgetConfig.launcherLabel)}"`
    : "";

  return `<script src="https://cdn.tryskilly.app/web/v1.js"
        data-skilly-key="${escapeAttribute(publishableKey)}"
        data-skilly-skill="${escapeAttribute(skillId)}"${runtimeAttributes}${appearanceAttributes}${launcherAttribute}
        defer></script>`;
}
