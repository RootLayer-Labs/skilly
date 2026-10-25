import { describe, expect, test } from "bun:test";
import { desktopCallbackUrl } from "../src/lib/desktopAuth";

describe("desktop sign-in callback", () => {
  test("returns production states to the production app", () => {
    expect(desktopCallbackUrl("AbCdEf0123456789xyz").toString()).toBe("skilly://auth/callback");
  });

  test("returns Debug-build states to the dev app", () => {
    expect(desktopCallbackUrl("skillydev_AbCdEf0123456789").toString()).toBe("skilly-dev://auth/callback");
  });
});
