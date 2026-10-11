import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";

test("renders Guide empty/save states and Try it workspace defaults without leaking module mocks", async () => {
  const processResult = Bun.spawn([
    process.execPath,
    "run",
    fileURLToPath(new URL("./fixtures/guidePreviewRendering.ts", import.meta.url)),
  ], { stdout: "pipe", stderr: "pipe" });
  const [exitCode, stdout, stderr] = await Promise.all([
    processResult.exited,
    new Response(processResult.stdout).text(),
    new Response(processResult.stderr).text(),
  ]);
  expect({ exitCode, stderr }).toEqual({ exitCode: 0, stderr: "" });
  expect(stdout.trim()).toBe("Guide empty/save states and Try it initial site/questions rendered successfully.");
});
