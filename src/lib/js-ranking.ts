/**
 * Pure data model shared by the npm fetch pipeline and the UI.
 *
 * This module MUST stay free of side effects and top-level awaits: it is
 * imported by components rendered on both sides of the build. The fetch
 * pipeline lives in `npm.ts` and must never be imported from client code.
 */

import type { JsFrameworkMeta } from "@/lib/js-frameworks"

export interface RankedJsFramework extends JsFrameworkMeta {
  /** npm downloads of the meta-framework package over the 30-day window. */
  downloads: number
  /** 1-based position in the ranking. */
  rank: number
  /** The framework's fraction of the group's total downloads. */
  share: number
}

export interface JsRankingsWindow {
  /** First day included in the download window (`YYYY-MM-DD`). */
  from: string
  /** Last day included in the download window (`YYYY-MM-DD`). */
  to: string
}

export interface JsFrameworkRankingsMeta {
  /** ISO timestamp of when the counts were fetched. */
  generatedAt: string
  /**
   * The trailing window the npm API reported, echoed verbatim so the page
   * never implies a calendar month.
   */
  window: JsRankingsWindow
  frameworksTracked: number
}

export interface JsFrameworkRankings {
  meta: JsFrameworkRankingsMeta
  /** Sum of the download counts across the catalog. */
  total: number
  /** Descending by downloads. */
  ranked: RankedJsFramework[]
}
