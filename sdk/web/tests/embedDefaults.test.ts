import { describe, expect, test } from "bun:test";
import { resolveEmbedRuntimeUrls } from "../src/index";

describe("resolveEmbedRuntimeUrls", () => {
  test("the official CDN script talks to Studio and loads the core from the CDN without extra attributes", () => {
    expect(resolveEmbedRuntimeUrls({ scriptSrc: "https://cdn.tryskilly.app/web/v1.js" })).toEqual({
      backendUrl: "https://studio.tryskilly.app",
      coreUrl: "https://cdn.tryskilly.app/web/v1.0.0/skilly_core_web_sdk.js",
    });
  });

  test("explicit attributes still win on the official CDN", () => {
    expect(resolveEmbedRuntimeUrls({
      scriptSrc: "https://cdn.tryskilly.app/web/v1.js",
      backendUrl: "https://staging.studio.example",
      coreUrl: "https://cdn.example/core.js",
    })).toEqual({ backendUrl: "https://staging.studio.example", coreUrl: "https://cdn.example/core.js" });
  });

  test("self-hosted and local copies keep today's behavior (no backend means simulated mode)", () => {
    expect(resolveEmbedRuntimeUrls({ scriptSrc: "http://localhost:4399/dist/skilly-web.global.js" })).toEqual({
      backendUrl: undefined,
      coreUrl: undefined,
    });
    expect(resolveEmbedRuntimeUrls({ scriptSrc: "" })).toEqual({ backendUrl: undefined, coreUrl: undefined });
  });
});
