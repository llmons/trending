/**
 * Build-time npm download pipeline for the JS full-stack framework ranking.
 *
 * The site has no committed data files. `astro build` fetches every download
 * count from the public npm downloads API exactly once — the top-level await
 * below runs a single time per build and every page shares the resolved
 * result — then renders as static HTML from it.
 *
 * One keyless request per framework — 5 lookups paced at one per second, a
 * few seconds of fetch time. Scoped packages (`@sveltejs/kit`,
 * `@solidjs/start`) cannot be bundled into a bulk lookup — the API rejects
 * mixed bulk requests outright — so every package is fetched individually,
 * which also keeps all five counts on an identical code path.
 *
 * If a fetch ultimately fails the build fails too and the previously deployed
 * site stays online: same all-or-nothing principle as `data.ts` and
 * `pkgsite.ts`, no stale-data fallback.
 *
 * `astro dev` re-evaluates this module once per dev-server session.
 *
 * ⚠ Server-only: never import a VALUE from this module in client code
 * (islands). The bundler would ship the fetch pipeline — including this
 * module's top-level await — into the browser bundle and every visitor would
 * start a 5-request fetch. Client code imports the data model from
 * `@/lib/js-ranking` instead.
 */

import { JS_FRAMEWORK_CATALOG } from "@/lib/js-frameworks"
import type {
  JsFrameworkRankings,
  JsRankingsWindow,
  RankedJsFramework,
} from "@/lib/js-ranking"

const API_BASE = "https://api.npmjs.org/downloads/point/last-month/"

/**
 * Spacing between requests, mirroring the pacing pattern in `pkgsite.ts` and
 * `github.ts`. npm publishes no hard per-IP limit for this endpoint, and five
 * requests per build is far below any usage that would matter.
 */
export const NPM_INTERVAL_MS = 1_000

const REQUEST_TIMEOUT_MS = 30_000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** ms timestamp of the last request start — module-level so all callers share the pace. */
let lastRequestAt = 0

async function pace(): Promise<void> {
  const elapsed = Date.now() - lastRequestAt
  if (elapsed < NPM_INTERVAL_MS) await sleep(NPM_INTERVAL_MS - elapsed)
  lastRequestAt = Date.now()
}

const REQUEST_HEADERS = {
  Accept: "application/json",
  "User-Agent": "trending-build (+https://github.com/llmons/trending)",
}

interface PointResponse {
  downloads?: unknown
  start?: unknown
  end?: unknown
}

interface Point {
  downloads: number
  window: JsRankingsWindow
}

/**
 * Trailing-window downloads for one npm package.
 *
 * Network/parse failures are retried with a bounded backoff (5s → 15s); any
 * non-200 response is fatal for the build — the old site stays deployed until
 * the next successful run.
 */
async function fetchPoint(npmPackage: string): Promise<Point> {
  const url = `${API_BASE}${encodeURIComponent(npmPackage)}`

  // Exponential backoff for transient failures: 5s → 15s.
  const backoffMs = [5_000, 15_000]

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
      const backoff = backoffMs[attempt] ?? 15_000
      console.log(`  · network error — retrying in ${backoff / 1000}s`)
      await sleep(backoff)
      continue
    }

    // A mistyped package answers 404 with `{"error":"package x not found"}` —
    // retrying would only burn time, so every non-200 is fatal.
    if (!res.ok) {
      throw new Error(
        `npm downloads failed (HTTP ${res.status}): ${npmPackage}`
      )
    }

    let data: PointResponse
    try {
      data = (await res.json()) as PointResponse
    } catch {
      const backoff = backoffMs[attempt] ?? 15_000
      console.log(`  · parse error — retrying in ${backoff / 1000}s`)
      await sleep(backoff)
      continue
    }

    const { downloads, start, end } = data
    if (
      typeof downloads !== "number" ||
      !Number.isFinite(downloads) ||
      downloads < 0
    ) {
      throw new Error(
        `Unexpected npm response: missing downloads.total (${npmPackage})`
      )
    }
    if (typeof start !== "string" || typeof end !== "string") {
      throw new Error(`Unexpected npm response: missing window (${npmPackage})`)
    }
    return { downloads, window: { from: start, to: end } }
  }

  throw new Error(`npm downloads failed after retries: ${npmPackage}`)
}

async function fetchJsFrameworkRankings(): Promise<JsFrameworkRankings> {
  console.log(
    `Fetching live data from the npm downloads API\n` +
      `  frameworks: ${JS_FRAMEWORK_CATALOG.length} requests (paced at ${60_000 / NPM_INTERVAL_MS} req/min)`
  )

  const points = new Map<string, Point>()
  for (const [index, framework] of JS_FRAMEWORK_CATALOG.entries()) {
    const progress = `[${index + 1}/${JS_FRAMEWORK_CATALOG.length}]`
    console.log(`${progress} ${framework.name} — ${framework.npmPackage}`)
    points.set(framework.id, await fetchPoint(framework.npmPackage))
  }

  // The API cuts its trailing window at "yesterday", so a build that straddles
  // midnight UTC could mix two windows. Comparing them costs nothing and
  // turns that race into a loud failure instead of a silently blended count.
  const windows = [...points.values()].map((point) => point.window)
  const window = windows[0]
  if (!window) throw new Error("npm returned no download points")
  const mismatched = windows.find(
    (candidate) => candidate.from !== window.from || candidate.to !== window.to
  )
  if (mismatched) {
    throw new Error(
      `npm windows disagree across requests: ${window.from}..${window.to} vs ${mismatched.from}..${mismatched.to} — rebuild to align them`
    )
  }

  const total = [...points.values()].reduce(
    (sum, point) => sum + point.downloads,
    0
  )

  const ranked: RankedJsFramework[] = JS_FRAMEWORK_CATALOG.map((framework) => {
    const point = points.get(framework.id)
    if (!point) throw new Error(`Missing download count for ${framework.id}`)
    return {
      ...framework,
      downloads: point.downloads,
      share: total > 0 ? point.downloads / total : 0,
      rank: 0,
    }
  }).sort((a, b) => b.downloads - a.downloads)

  ranked.forEach((framework, index) => {
    framework.rank = index + 1
  })

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      window,
      frameworksTracked: JS_FRAMEWORK_CATALOG.length,
    },
    total,
    ranked,
  }
}

// One fetch per build — module-level top-level await, shared by all pages.
const rankings: JsFrameworkRankings = await fetchJsFrameworkRankings().catch(
  (error) => {
    throw new Error(
      `npm fetch failed — the site cannot be built without fresh data.\n${error}`
    )
  }
)

/** The fetched JS framework rankings (already resolved by the time pages render). */
export function loadJsFrameworkRankings(): JsFrameworkRankings {
  return rankings
}

/** Deep link to the package's npm page. */
export function npmPackageUrl(npmPackage: string): string {
  return `https://www.npmjs.com/package/${npmPackage}`
}

/** Deep link to the public npm downloads API for one package. */
export function npmDownloadsApiUrl(npmPackage: string): string {
  return `${API_BASE}${encodeURIComponent(npmPackage)}`
}
