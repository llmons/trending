## Project Overview

`trending` is a daily-updated static website that presents rankings across tech-stack domains. Its first section ranks programming languages based on the number of qualifying GitHub repositories created within a rolling one-year window, across three inclusive star-threshold tiers (≥2, ≥20, ≥100 stars; repositories below 2 stars are deliberately out of scope), plus a weighted composite (tier weights 1×/2×/4×) derived from the same counts. A second section, live at `/go/`, ranks a manual catalog of 9 Go frameworks — five web (Gin, Echo, Fiber, GoFrame, Hertz) and four RPC (gRPC-Go, Thrift, Dubbo, Kitex) — by their pkg.go.dev v1 imported-by totals (canonical package path per framework) — a snapshot metric, not a rolling window.

## Project Positioning

- A data-driven, fully static site that surfaces language popularity trends from public GitHub repository data.
- Rankings focus on **common/mainstream programming languages only** — a hand-curated catalog of 39 in `src/lib/languages.ts` — not the full set of languages available on GitHub. Niche, esoteric, or non-general-purpose languages are intentionally excluded from the ranking scope.
- The site is rebuilt and redeployed automatically on a daily schedule (GitHub Actions → GitHub Pages), always reflecting the most recent rolling one-year window at run time.

## Tech Stack

- **Framework**: Astro — pages are `.astro`; interactive widgets (star-tier tabs, FAQ accordion, theme toggle) are React islands, all pre-rendered at build time
- **Runtime**: Node (>=22.23.4)
- **Package manager**: pnpm
- **Formatter**: Prettier
- **Linter**: ESLint
- **UI lib**: shadcn/ui (base-sera style, dark-first with a light theme)
- **Brand assets**: canonical mark in `public/logo.svg`, mirrored in `public/favicon.svg` (accent blue `#2a78d6`); no root-level logo source is kept.

All code, tooling, and project configuration must stay consistent with this defined tech stack; new dependencies or alternative tools should not be introduced without updating this section.

## Core Principles

- **Static by default**: All ranking pages are pre-rendered at build time; no client-side data fetching for ranking content. Tier switching is client-side, but the data for every tier is baked into the page at build time.
- **Dynamic time window**: The "last year" window is always computed at build/run time relative to the current date, never hardcoded.
- **Automation-first**: Daily builds and deployments are fully automated via CI/CD.
- **Consistency**: A single, unified toolchain and design system is used across the project.
- **No committed data files**: Every count is fetched fresh at build time. There is no data snapshot to maintain and the CI never pushes to the repository. The one exception is the **synthetic fixture** in `src/lib/fixtures/github-counts.ts`, consumed only by local mock builds: it is invented data, not a capture of past measurements; it replaces only the GitHub search counts; and it can never be deployed, because `data.ts` throws when `TRENDING_MOCK=1` meets CI.

## Data Source Notes

- Data is sourced from the public GitHub search API. **No self-managed credentials**: CI uses the automatically injected `GITHUB_TOKEN` (dedicated 30 searches/min), local builds run unauthenticated (shared 10 searches/min per IP).
- The `language:` qualifier matches each repository's **primary language** (Linguist's dominant tag). A multi-language repository counts only toward its primary language; crediting secondary languages is infeasible (no aggregate API — it would take one request per repository).
- The fetch runs **inside `astro build`** (top-level await in `src/lib/data.ts`, evaluated once per build and shared by all pages).
- One query per language per star tier: 39 languages × 3 tiers = **117 requests** per build (≈4.5 minutes authenticated in CI, ≈12 minutes unauthenticated locally). Multi-word language names are double-quoted in the query. The weighted composite in Field notes is pure arithmetic on these counts — it never adds requests.
- Pacing matches the mode's limit exactly — one request every 2s (authenticated) or 6s (unauthenticated). `403`/`429` responses trigger rate-limit waits (≥30s) and retries with exponential backoff; languages that still fail are retried in whole-pipeline recovery rounds after cooling down.
- The Go-framework counts come from pkg.go.dev's official v1 API (`https://pkg.go.dev/v1/imported-by/{package-path}`), keyed by each framework's canonical package path: keyless, ~9 requests per build at 1s pacing, retried with backoff, and the build fails if a count cannot be fetched. goproxy.cn's stats API and proxy.golang.org expose no public download-count API — which is why imported-by was chosen.
- If the fetch ultimately fails, the build fails too — the previously deployed site stays online until the next successful build. There is no stale-data fallback.
- **Local mock mode**: `TRENDING_MOCK=1` (via `pnpm build:mock` / `pnpm dev:mock`) swaps **only the 117 GitHub search counts** for `src/lib/fixtures/github-counts.ts`. The window is still computed at build time, the ranking/share/weighted derivation is the same code as the live path, and the pkg.go.dev requests are still real (~9 requests, ~10s). Mock output carries `meta.sample`, a `Sample data` notice, and `noindex`; the flag throws under `CI` / `GITHUB_ACTIONS` — at config load in `astro.config.mjs`, repeated in `data.ts`.

## Automation (CI/CD)

- `.github/workflows/deploy.yml` rebuilds and redeploys to GitHub Pages on a daily cron (`37 0 * * *` UTC), on pushes to `main`, and via manual dispatch.
- Pipeline: install → typecheck → lint → build (fetches + renders) → deploy-pages.
- The workflow never sets `TRENDING_MOCK`: mock mode is local-only and throws in CI.
- Deploy base path and site URL are configurable via `ASTRO_BASE` / `ASTRO_SITE` environment variables (defaults in `astro.config.mjs`).

## Local Development

- Real data: `pnpm build && pnpm preview` — the build fetches live data, so it takes ~12 minutes.
- `pnpm dev` re-fetches once per dev-server session; the first page request is slow.
- **Fast path — `pnpm build:mock && pnpm preview`, or `pnpm dev:mock`**: seconds, and no GitHub fetch at all. Only the language counts are synthetic; the Go framework counts still come from pkg.go.dev, so the `/go/` page needs network (~10s).
- Never deploy `build:mock` output — it is marked `Sample data` and `noindex`.
- Checks: `pnpm typecheck`, `pnpm lint`, `pnpm format`.
- **Agents must not start a real build or dev server on their own initiative.** `pnpm build` and `pnpm dev` (as well as `astro build` / `astro dev`) trigger the full 117-request GitHub star-throttled fetch, which takes minutes locally and routinely stalls on rate limits — so they are not a usable agent-side verification step. Use `pnpm build:mock` / `pnpm dev:mock` when a rendered page is actually needed, and `pnpm typecheck`, `pnpm lint`, `pnpm format`, and targeted reads otherwise. Leave real builds to the user or CI.

## Contribution & Workflow Guidelines

- Keep the project positioning, scope, and tech stack above as the source of truth for all changes.
- Preserve the static-generation, dynamic-window, and automation principles in every modification.
- Maintain a single consistent toolchain and design system throughout the codebase.
- The repository ships no agent skills, MCP configuration, or editor presets (`.agents/`, `.mcp.json`, `skills-lock.json`, and `.vscode/` were removed). Keep agent-facing guidance in this file only; do not reintroduce those artifacts.
- Product decisions (language catalog, star tiers, window) are reflected in user-facing copy — keep the methodology page, FAQ, and insight cards in sync with code changes.
- Do not run the real `pnpm build` or `pnpm dev` proactively: the GitHub star fetch is slow and rate-limited, so real builds are the user's or CI's job. Use `pnpm build:mock` / `pnpm dev:mock` for local rendering checks and never deploy their output (details under Local Development).

## Initialization

As a contributor to `trending`, you must respect the Project Overview, Positioning, Tech Stack, and Core Principles above, and ensure your changes remain within the defined language scope and data-source constraints.
