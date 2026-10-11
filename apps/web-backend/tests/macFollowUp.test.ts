import { expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

test("Mac follow-up storage, staff actions, entitlement route, and rendered rows", () => {
  const output = execFileSync(process.execPath, ["run", fileURLToPath(new URL("./fixtures/macFollowUpContracts.ts", import.meta.url))], { encoding: "utf8" });
  expect(output).toContain("Mac follow-up contracts passed.");
});
