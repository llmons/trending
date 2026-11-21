/**
 * Synthetic GitHub search counts for **local mock builds only**.
 *
 * `pnpm build:mock` / `pnpm dev:mock` set `TRENDING_MOCK=1`, which swaps the
 * 117-request GitHub search pipeline for this table. Nothing else changes:
 * the rolling window is still computed at build time, the tier/weighted/
 * category derivations still run in `data.ts`, and the pkg.go.dev request
 * counts are still fetched live.
 *
 * Rules this file must keep:
 * - **Never deployed.** `data.ts` throws when `TRENDING_MOCK=1` meets CI, and
 *   mock builds render a `Sample data` notice plus `noindex`.
 * - **Not a snapshot.** The numbers are invented, not a capture of past
 *   measurements — do not treat them as history or as a fallback.
 * - **Monotone tiers**: `ge100 <= ge20 <= ge2` for every language, so the
 *   three tiers stay nested like the real queries. Keep a couple of zeros and
 *   one tie so the share/sort edge cases stay exercised.
 *
 * Coverage is checked against `LANGUAGE_CATALOG` at load time, so adding a
 * language without a row fails the mock build with a clear message.
 */

import type { TierId } from "@/lib/tiers"

export type MockGitHubCounts = Record<TierId, number>

export const MOCK_GITHUB_COUNTS: Record<string, MockGitHubCounts> = {
  JavaScript: { ge2: 52_000, ge20: 6_400, ge100: 780 },
  TypeScript: { ge2: 61_000, ge20: 7_200, ge100: 940 },
  Python: { ge2: 78_000, ge20: 8_300, ge100: 1_020 },
  Java: { ge2: 21_000, ge20: 2_100, ge100: 260 },
  C: { ge2: 12_500, ge20: 1_100, ge100: 120 },
  "C++": { ge2: 18_000, ge20: 1_700, ge100: 190 },
  "C#": { ge2: 15_500, ge20: 1_400, ge100: 150 },
  Go: { ge2: 24_000, ge20: 3_200, ge100: 430 },
  Rust: { ge2: 16_500, ge20: 2_300, ge100: 330 },
  Zig: { ge2: 2_100, ge20: 320, ge100: 55 },
  PHP: { ge2: 14_000, ge20: 1_200, ge100: 110 },
  Ruby: { ge2: 9_800, ge20: 820, ge100: 80 },
  Swift: { ge2: 9_200, ge20: 900, ge100: 95 },
  Kotlin: { ge2: 8_800, ge20: 780, ge100: 70 },
  Dart: { ge2: 7_600, ge20: 640, ge100: 60 },
  Scala: { ge2: 3_400, ge20: 280, ge100: 25 },
  "Objective-C": { ge2: 2_400, ge20: 190, ge100: 15 },
  Groovy: { ge2: 1_500, ge20: 110, ge100: 9 },
  Perl: { ge2: 1_300, ge20: 95, ge100: 7 },
  VBA: { ge2: 2_600, ge20: 90, ge100: 4 },
  // Zero-count edge case: the ≥100 tier must render without dividing by zero.
  VBScript: { ge2: 320, ge20: 8, ge100: 0 },
  "Visual Basic 6.0": { ge2: 480, ge20: 14, ge100: 1 },
  // Ties with Groovy at the ≥100 tier exercise rank assignment.
  "Visual Basic .NET": { ge2: 2_100, ge20: 160, ge100: 9 },
  HTML: { ge2: 31_000, ge20: 1_800, ge100: 120 },
  CSS: { ge2: 27_000, ge20: 1_500, ge100: 90 },
  Vue: { ge2: 8_900, ge20: 760, ge100: 65 },
  Svelte: { ge2: 4_200, ge20: 480, ge100: 45 },
  Astro: { ge2: 3_100, ge20: 420, ge100: 40 },
  Markdown: { ge2: 24_000, ge20: 900, ge100: 60 },
  R: { ge2: 6_200, ge20: 520, ge100: 48 },
  MATLAB: { ge2: 2_800, ge20: 210, ge100: 18 },
  SQL: { ge2: 5_400, ge20: 380, ge100: 30 },
  "Jupyter Notebook": { ge2: 12_800, ge20: 980, ge100: 85 },
  Fortran: { ge2: 720, ge20: 60, ge100: 5 },
  Shell: { ge2: 19_500, ge20: 1_350, ge100: 95 },
  PowerShell: { ge2: 4_600, ge20: 300, ge100: 22 },
  Assembly: { ge2: 3_300, ge20: 240, ge100: 18 },
  Lua: { ge2: 3_900, ge20: 300, ge100: 24 },
}
