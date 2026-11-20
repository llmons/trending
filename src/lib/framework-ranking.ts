/**
 * Pure data model shared by the framework fetch pipeline and the UI.
 *
 * This module MUST stay free of side effects and top-level awaits: it is
 * imported by client-side islands, where its values ship inside the client
 * bundle. The fetch pipeline lives in `pkgsite.ts` and must never be
 * imported from client code.
 */

import type { FrameworkCategory, FrameworkMeta } from "@/lib/frameworks"

export interface RankedFramework extends FrameworkMeta {
  /** Modules importing the framework's package, per pkg.go.dev. */
  importers: number
  /** 1-based position within its category. */
  rank: number
}

export interface FrameworkGroup {
  id: FrameworkCategory
  label: string
  /** Sum of the imported-by counts across the group's frameworks. */
  total: number
  ranked: RankedFramework[]
}

export interface FrameworkRankingsMeta {
  /** ISO timestamp of when the counts were fetched. */
  generatedAt: string
  frameworksTracked: number
}

export interface FrameworkRankings {
  meta: FrameworkRankingsMeta
  groups: Record<FrameworkCategory, FrameworkGroup>
  /**
   * All tracked frameworks, descending by importers. The `rank` field
   * stays per-category — the global list only fixes display order.
   */
  ranked: RankedFramework[]
}
