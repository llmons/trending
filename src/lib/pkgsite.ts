/**
 * Build-time framework ranking pipeline.
 *
 * The site has no committed data files. `astro build` fetches every
 * "imported by" count from the public pkg.go.dev API exactly once — the
 * top-level await below runs a single time per build and every page shares
 * the resolved result — then renders as static HTML from it.
 *
 * One keyless request per framework — ~9 lookups paced at one per second,
 * a few seconds of fetch time. If a fetch ultimately fails the build fails
 * too and the previously deployed site stays online: same all-or-nothing
 * principle as `data.ts`, no stale-data fallback.
 *
 * `astro dev` re-evaluates this module once per dev-server session.
 *
 * ⚠ Server-only: never import a VALUE from this module in client code
 * (islands). The bundler would ship the fetch pipeline — including this
 * module's top-level await — into the browser bundle and every visitor
 * would start an ~9-request fetch. Client code imports the data model
 * from `@/lib/framework-ranking` instead.
 */

import { FRAMEWORK_CATALOG, type FrameworkCategory } from "@/lib/frameworks"
import type {
  FrameworkGroup,
  FrameworkRankings,
  RankedFramework,
} from "@/lib/framework-ranking"

const API_BASE = "https://pkg.go.dev/v1/imported-by/"

/**
 * Spacing between requests, mirroring the pacing pattern in `github.ts`:
 * `pace()` sleeps until the full interval has elapsed, so actual spacing
 * can only be ≥ the interval.
 */
export const PKGSITE_INTERVAL_MS = 1_000

const REQUEST_TIMEOUT_MS = 60_000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** ms timestamp of the last request start — module-level so all callers share the pace. */
let lastRequestAt = 0

async function pace(): Promise<void> {
  const elapsed = Date.now() - lastRequestAt
  if (elapsed < PKGSITE_INTERVAL_MS) await sleep(PKGSITE_INTERVAL_MS - elapsed)
  lastRequestAt = Date.now()
}

// pkg.go.dev serves the API to normal clients, but send a browser-ish UA.
const REQUEST_HEADERS = {
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
}

const GROUP_LABELS: Record<FrameworkCategory, string> = {
  web: "Web frameworks",
  rpc: "RPC frameworks",
}

/**
 * Imported-by total for one canonical package path.
 *
 * Network/parse failures are retried with a bounded backoff (20s → 40s);
 * any non-200 response is fatal for the build — the old site stays
 * deployed until the next successful run.
 */
async function fetchImportedBy(importPath: string): Promise<number> {
  const url = `${API_BASE}${importPath}`

  // Exponential backoff for transient failures: 20s → 40s.
  const backoffMs = [20_000, 40_000]

  for (let attempt = 0; attempt < 3; attempt++) {
    await pace()

    let res: Response
    try {
      // The whole exchange — headers and body — shares the timeout signal,
      // so a stall at any stage is retried rather than fatal.
      res = await fetch(url, {
        headers: REQUEST_HEADERS,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch {
      const backoff = backoffMs[attempt] ?? 40_000
      console.log(`  · network error — retrying in ${backoff / 1000}s`)
      await sleep(backoff)
      continue
    }

    if (!res.ok) {
      throw new Error(
        `pkg.go.dev imported-by failed (HTTP ${res.status}): ${importPath}`
      )
    }

    let data: { importedBy?: { total?: unknown } }
    try {
      data = (await res.json()) as { importedBy?: { total?: unknown } }
    } catch {
      const backoff = backoffMs[attempt] ?? 40_000
      console.log(`  · parse error — retrying in ${backoff / 1000}s`)
      await sleep(backoff)
      continue
    }

    const total = data.importedBy?.total
    // pkg.go.dev reports -1 when it has no computed total for a package
    // (imported-by counts are filled in asynchronously). Rendering a
    // negative number would be worse than failing the build.
    if (typeof total !== "number" || total < 0) {
      throw new Error(
        `Unexpected pkg.go.dev response: missing importedBy.total (${importPath})`
      )
    }
    return total
  }

  throw new Error(`pkg.go.dev imported-by failed after retries: ${importPath}`)
}

async function fetchFrameworkRankings(): Promise<FrameworkRankings> {
  console.log(
    `Fetching live data from the pkg.go.dev imported-by API\n` +
      `  frameworks: ${FRAMEWORK_CATALOG.length} requests (paced at ${60_000 / PKGSITE_INTERVAL_MS} req/min)`
  )

  const importers = new Map<string, number>()
  for (const [index, framework] of FRAMEWORK_CATALOG.entries()) {
    const progress = `[${index + 1}/${FRAMEWORK_CATALOG.length}]`
    console.log(`${progress} ${framework.name} — ${framework.importPath}`)
    importers.set(framework.id, await fetchImportedBy(framework.importPath))
  }

  const all: RankedFramework[] = FRAMEWORK_CATALOG.map((framework) => {
    const count = importers.get(framework.id)
    if (count === undefined) {
      throw new Error(`Missing imported-by count for ${framework.id}`)
    }
    return { ...framework, importers: count, rank: 0 }
  })

  // Per-category groups, sorted desc by importers; `rank` is assigned
  // within the category. The group total sums that category's importers.
  const groups = {} as Record<FrameworkCategory, FrameworkGroup>
  for (const category of Object.keys(GROUP_LABELS) as FrameworkCategory[]) {
    const ranked = all
      .filter((framework) => framework.category === category)
      .sort((a, b) => b.importers - a.importers)

    ranked.forEach((framework, index) => {
      framework.rank = index + 1
    })

    const total = ranked.reduce(
      (sum, framework) => sum + framework.importers,
      0
    )
    groups[category] = {
      id: category,
      label: GROUP_LABELS[category],
      total,
      ranked,
    }
  }

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      frameworksTracked: FRAMEWORK_CATALOG.length,
    },
    groups,
    ranked: [...all].sort((a, b) => b.importers - a.importers),
  }
}

// One fetch per build — module-level top-level await, shared by all pages.
const rankings: FrameworkRankings = await fetchFrameworkRankings().catch(
  (error) => {
    throw new Error(
      `Framework fetch failed — the site cannot be built without fresh data.\n${error}`
    )
  }
)

/** The fetched framework rankings (already resolved by the time pages render). */
export function loadFrameworkRankings(): FrameworkRankings {
  return rankings
}

/** Deep link to the package's pkg.go.dev page. */
export function pkgGoDevUrl(importPath: string): string {
  return `https://pkg.go.dev/${importPath}`
}
