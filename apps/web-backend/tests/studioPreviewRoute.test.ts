import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";

test("Studio's Try it preview records the first preview without leaking module mocks", async () => {
  const processResult = Bun.spawn([process.execPath, "run", fileURLToPath(new URL("./fixtures/studioPreviewRoute.ts", import.meta.url))], { stdout: "pipe", stderr: "pipe" });
  const [exitCode, stdout, stderr] = await Promise.all([processResult.exited, new Response(processResult.stdout).text(), new Response(processResult.stderr).text()]);
  expect({ exitCode, stderr }).toEqual({ exitCode: 0, stderr: "" });
  expect(stdout.trim()).toBe("Studio preview route records the first Try it preview only.");
});
