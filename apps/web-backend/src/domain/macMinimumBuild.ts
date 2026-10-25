// Mac builds from v3.6 send X-Skilly-Build. Older builds omit it and are never
// blocked here: they would show the block as a "no subscription" paywall.
export function requiresMacUpdate(
  buildHeader: string | null,
  minimumBuild: string | undefined = process.env.MAC_MINIMUM_BUILD,
): boolean {
  const build = Number(buildHeader);
  const minimum = Number(minimumBuild);
  return Number.isInteger(build) && build > 0 && Number.isInteger(minimum) && build < minimum;
}
