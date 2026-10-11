import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";

test("renders the builder get-live path across readiness states without leaking module mocks", async () => {
  const processResult = Bun.spawn([
    process.execPath,
    "run",
    fileURLToPath(new URL("./fixtures/goLiveRendering.ts", import.meta.url)),
  ], { stdout: "pipe", stderr: "pipe" });
  const [exitCode, stdout, stderr] = await Promise.all([
    processResult.exited,
    new Response(processResult.stdout).text(),
    new Response(processResult.stderr).text(),
  ]);
  expect({ exitCode, stderr }).toEqual({ exitCode: 0, stderr: "" });
  expect(stdout.trim()).toBe("Go live, Home, Guide, Usage, and builder/People navigation rendered successfully.");
});
