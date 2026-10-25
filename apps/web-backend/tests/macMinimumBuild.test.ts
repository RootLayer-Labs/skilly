import { describe, expect, test } from "bun:test";
import { requiresMacUpdate } from "../src/domain/macMinimumBuild";

describe("Mac minimum build", () => {
  test("blocks builds below the configured minimum", () => {
    expect(requiresMacUpdate("31", "32")).toBe(true);
  });

  test("allows builds at or above the minimum", () => {
    expect(requiresMacUpdate("32", "32")).toBe(false);
    expect(requiresMacUpdate("40", "32")).toBe(false);
  });

  test("never blocks old builds that send no build header", () => {
    expect(requiresMacUpdate(null, "32")).toBe(false);
  });

  test("blocks nothing when no minimum is configured", () => {
    expect(requiresMacUpdate("31", undefined)).toBe(false);
    expect(requiresMacUpdate("31", "")).toBe(false);
  });
});
