import { describe, expect, test } from "bun:test";
import { serverDistinctId } from "../src/lib/analytics";

describe("server analytics identity", () => {
  test("gives each account its own identity", () => {
    expect(serverDistinctId({ workos_user_id: "user_a" })).toBe("user_a");
    expect(serverDistinctId({ workos_user_id: "user_b" })).toBe("user_b");
  });

  test("keeps tenant identity for tenant-scoped events", () => {
    expect(serverDistinctId({ tenant_id: "tenant_1" })).toBe("tenant_1");
  });

  test("falls back to the shared backend identity", () => {
    expect(serverDistinctId({})).toBe("skilly_web_backend");
    expect(serverDistinctId({ workos_user_id: "" })).toBe("skilly_web_backend");
  });
});
