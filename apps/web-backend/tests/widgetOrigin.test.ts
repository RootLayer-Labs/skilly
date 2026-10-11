import { describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { describeWidgetOrigin } from "@/http";

const studioRequest = new NextRequest("https://studio.tryskilly.app/api/web/token", { method: "POST" });

describe("describeWidgetOrigin", () => {
  test("a widget running inside Studio is the preview", () => {
    expect(describeWidgetOrigin(studioRequest, "https://studio.tryskilly.app")).toEqual({
      origin_host: "studio.tryskilly.app",
      is_studio_preview: true,
    });
  });

  test("a widget on the customer's site is not the preview", () => {
    expect(describeWidgetOrigin(studioRequest, "https://app.acme.com/settings")).toEqual({
      origin_host: "app.acme.com",
      is_studio_preview: false,
    });
  });

  test("native and malformed origins report no host", () => {
    expect(describeWidgetOrigin(studioRequest, null)).toEqual({ origin_host: null, is_studio_preview: false });
    expect(describeWidgetOrigin(studioRequest, "not a url")).toEqual({ origin_host: null, is_studio_preview: false });
  });
});
