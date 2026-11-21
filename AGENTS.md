## Project Overview

`trending` is a daily-updated static website that presents rankings across tech-stack domains.

The **lead ranking** (home section 01) orders a hand-curated catalog of programming languages by a **weighted composite**: repositories created inside the rolling one-year window, counted at three inclusive star tiers (≥2, ≥20, ≥100; below 2 stars is deliberately out of scope) and weighted 1× / 2× / 4×, so a repository that cleared every threshold contributes seven points. Only the top 10 are shown.

**Section 02** re-ranks the same 114 counts one star threshold at a time — all 38 languages, switchable between ≥2 / ≥20 / ≥100 — and **section 03** is four readings (composition, threshold decay, concentration, method) derived arithmetically from those counts.

Two separate indexes live on their own pages: `/go/` ranks 9 Go frameworks — five web (Gin, Echo, Fiber, GoFrame, Hertz) and four RPC (gRPC-Go, Thrift, Dubbo, Kitex) — by pkg.go.dev v1 imported-by totals per canonical package path (a cumulative snapshot, not a window); `/js/` ranks 5 JS/TS full-stack meta-frameworks — Next.js, Astro, SvelteKit, Nuxt, SolidStart — by npm downloads of each meta-framework package over the registry's trailing 30 days (install-event flow, neither deduplicated nor cumulative).

## Project Positioning

- A data-driven, fully static site that surfaces language popularity trends from public GitHub repository data.
- Rankings focus on **common/mainstream programming languages only** — a hand-curated catalog of **38** in `src/lib/languages.ts` — not the full set of languages on GitHub. Niche, esoteric, or non-general-purpose languages are intentionally excluded.
- **The catalog count is even on purpose.** The desktop threshold table splits into two balanced columns (19 + 19); adding or removing one language breaks that symmetry, so catalog changes come in pairs or accept an unbalanced split.
- The site is rebuilt and redeployed automatically on a daily schedule (GitHub Actions → GitHub Pages), always reflecting the most recent rolling one-year window at run time.

## Tech Stack

- **Framework**: Astro — pages are `.astro`; interactive widgets are Svelte 5 islands: `tier-switch` (threshold tabs + table), `theme-toggle`, `nav-menu` (mobile sheet), `faq`, `hero-field` (canvas). Everything is pre-rendered at build time.
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite`, plus one stylesheet — `src/styles/global.css` — where design tokens live in `@theme` and shared recipes in `@layer components`.
- **UI system**: hand-built. **No component library, no React, no CSS-in-JS, no icon package** — buttons, tables, labels and bars are recipes in `global.css`; icons are inline SVG through `src/components/icon.astro`.
- **Theme**: dark-first with a light counterpart, both defined as CSS custom properties on `:root` / `.dark`, switched by a Svelte island that honours `prefers-color-scheme` and `localStorage`.
- **Runtime**: Node (>=22.23.4) · **Package manager**: pnpm · **Formatter**: Prettier · **Linter**: ESLint.
- **Brand**: canonical mark in `public/logo.svg`, mirrored in `public/favicon.svg`, both in the accent blue `#1c68cc` — the same value as `--accent`.

All code, tooling, and project configuration must stay consistent with this defined tech stack; new dependencies or alternative tools should not be introduced without updating this section.

## Design System

The site reads as a printed data index: hairlines instead of boxes, mono numerals, one accent, generous white space.

- **Layout** — every block sits on `.wrap` (max 86rem, 20/32px side padding), so left and right edges are equal at every width. Sections are `main > section`, each 1–2 screens tall at 1440×900, each opening with a `SectionHeading` (`index` / title / aside / description). Section order is a product decision: 01 weighted ranking, 02 star thresholds, 03 breakdowns, 04 other indexes.
- **Hero** — the first screen carries the headline, one sentence of method, two actions, three figures and a **name-only index of the weighted top 10** (rank + colour + name, no scores: the numbers belong to section 01, so the panel reads as a table of contents rather than a duplicate table). Behind it: a hairline grid, a canvas dot field and a pointer-following glow.
- **Type** — one scale (`--text-display` … `--text-meta`) in `@theme`. Tracking is size-specific (display `-0.036em`, mono labels `+0.12em`) and leading runs inversely (0.94 at display, 1.62 in body). `.label` for uppercase mono metadata, `.num` for every figure (`tabular-nums`).
- **Colour** — one accent plus a neutral ramp, all semantic (`--canvas`, `--panel`, `--ink`, `--ink-soft`, `--ink-faint`, `--line`, …). Components never hardcode hex. **Text contrast floor is 4.5:1** in both themes (measured: ink 16.6 / 17.6, ink-soft 6.1 / 7.8, ink-faint 4.62 / 5.01, accent 4.85 / 7.31, light / dark).
- **Recipes** — `.btn` (`-solid` / `-line`), `.dtable`, `.material`, `.bar`, `.link-draw`, `.nav-item`, `.breakdown`. Extend these rather than inventing parallel ones; there is exactly one button pair, one radius (0), one link look.
- **Motion** — springs (`svelte/motion`) where state can be re-targeted mid-flight (the threshold indicator), CSS transitions for hover/press (`.btn:active` scales 0.97, linked cards lift 2px), a one-shot staged entrance in the hero (`.enter` + `--d`), and one canvas dot field that stops off-screen or when the tab hides. **Nothing fades in on scroll**; bar growth and number count-up are data drawing, not content reveals.
- **Accessibility** — global `:focus-visible` (2px accent, 3px offset), skip link first in the tab order, targets ≥44px outside running text, `aria-current` on the active nav item, `prefers-reduced-motion` (all motion collapses to its end state), `prefers-reduced-transparency` (materials go opaque) and `prefers-contrast: more`.
- **Tables** — the weighted table shows 10 rows with the three tier counts plus the composite score. The threshold table splits `19 / 19` at ≥1024 with `table-layout: fixed`, stays a single continuous list below it (the second `<thead>` is hidden 768–1023), and becomes two-line rows under 768. Numbers always come from `src/lib/format.ts`.
- **Copy** — plain declarative sentences that state the method and the number; no slogans, no marketing adjectives. Any change to the metric must be reflected here, in the methodology page, in the FAQ, and in the section descriptions.

## Core Principles

- **Static by default**: All ranking pages are pre-rendered at build time; no client-side data fetching for ranking content. Threshold switching is client-side, but every tier's data is baked into the page at build time.
- **Dynamic time window**: The "last year" window is always computed at build/run time relative to the current date, never hardcoded.
- **Automation-first**: Daily builds and deployments are fully automated via CI/CD.
- **Consistency**: A single toolchain and a single design system across every page.
- **No committed data files**: Every count is fetched fresh at build time, and CI never pushes to the repository. The one exception is the **synthetic fixture** in `src/lib/fixtures/github-counts.ts`, consumed only by local mock builds: it is invented data, not a capture of past measurements; it replaces only the GitHub search counts; and it can never be deployed, because `data.ts` throws when `TRENDING_MOCK=1` meets CI.

## Data Source Notes

- Data is sourced from the public GitHub search API. **No self-managed credentials**: CI uses the automatically injected `GITHUB_TOKEN` (dedicated 30 searches/min), local builds run unauthenticated (shared 10 searches/min per IP).
- The `language:` qualifier matches each repository's **primary language** (Linguist's dominant tag). A multi-language repository counts only toward its primary language; crediting secondary languages is infeasible (no aggregate API — it would take one request per repository).
- The fetch runs **inside `astro build`** (top-level await in `src/lib/data.ts`, evaluated once per build and shared by all pages).
- One query per language per star tier: 38 languages × 3 tiers = **114 requests** per build (≈4.5 minutes authenticated in CI, ≈12 minutes unauthenticated locally). Multi-word language names are double-quoted in the query. The weighted composite that leads the page is pure arithmetic on these counts — it never adds requests.
- Pacing matches the mode's limit exactly — one request every 2s (authenticated) or 6s (unauthenticated). `403`/`429` responses trigger rate-limit waits (≥30s) and retries with exponential backoff; languages that still fail are retried in whole-pipeline recovery rounds after cooling down.
- The Go-framework counts come from pkg.go.dev's official v1 API (`https://pkg.go.dev/v1/imported-by/{package-path}`), keyed by each framework's canonical package path: keyless, ~9 requests per build at 1s pacing, retried with backoff, and the build fails if a count cannot be fetched. goproxy.cn's stats API and proxy.golang.org expose no public download-count API — which is why imported-by was chosen.
- The JS-framework counts come from npm's public downloads API (`https://api.npmjs.org/downloads/point/last-month/{package}`): keyless, 5 requests per build at 1s pacing, retried with backoff, and the build fails if a count cannot be fetched. Bulk lookups reject scoped packages, so every package is fetched individually via `encodeURIComponent`. The window is the registry's trailing 30 days ending at the last complete UTC day — echoed verbatim on the page, never assumed to be a calendar month — and the five responses must agree on it or the build fails.
- Each JS entry is counted at the **meta-framework** package (`next`, `astro`, `@sveltejs/kit`, `nuxt`, `@solidjs/start`), never at the underlying renderer: `svelte` and `solid-js` are installed transitively by tooling, component libraries, and other packages, so counting them would measure the surrounding ecosystem and would rank Solid roughly 50× too high. Downloads are install events, not projects — CI re-installs, container layers, and transitive dependencies all inflate them, and nothing is deduplicated.
- If the fetch ultimately fails, the build fails too — the previously deployed site stays online until the next successful build.
- **Local mock mode**: `TRENDING_MOCK=1` (via `pnpm build:mock` / `pnpm dev:mock`) swaps **only the 114 GitHub search counts** for `src/lib/fixtures/github-counts.ts`. The window is still computed at build time, the ranking/share/weighted derivation is the same code as the live path, and the pkg.go.dev and npm requests are still real (~9 + 5 requests, ~12s). Mock output carries `meta.sample`, a `Sample data` notice, and `noindex`; the flag throws under `CI` / `GITHUB_ACTIONS` — at config load in `astro.config.mjs`, repeated in `data.ts`.

## Automation (CI/CD)

- `.github/workflows/deploy.yml` rebuilds and redeploys to GitHub Pages on a daily cron (`37 0 * * *` UTC), on pushes to `main`, and via manual dispatch.
- Pipeline: install → typecheck → lint → build (fetches + renders) → deploy-pages.
- The workflow never sets `TRENDING_MOCK`: mock mode is local-only and throws in CI.
- Deploy base path and site URL are configurable via `ASTRO_BASE` / `ASTRO_SITE` environment variables (defaults in `astro.config.mjs`).

## Local Development

- Real data: `pnpm build && pnpm preview` — the build fetches live data, so it takes ~12 minutes.
- `pnpm dev` re-fetches once per dev-server session; the first page request is slow.
- **Fast path — `pnpm build:mock && pnpm preview`, or `pnpm dev:mock`**: seconds, and no GitHub fetch at all. Only the language counts are synthetic; the Go and JS framework counts still come from pkg.go.dev and npm, so the `/go/` and `/js/` pages need network (~12s).
- Never deploy `build:mock` output — it is marked `Sample data` and `noindex`.
- Checks: `pnpm typecheck` (`astro check` + `svelte-check`), `pnpm lint`, `pnpm format`.
- **Agents must not start a real build or dev server on their own initiative.** `pnpm build` and `pnpm dev` (as well as `astro build` / `astro dev`) trigger the full 114-request GitHub star-throttled fetch, which takes minutes locally and routinely stalls on rate limits — so they are not a usable agent-side verification step. Use `pnpm build:mock` / `pnpm dev:mock` when a rendered page is actually needed, and `pnpm typecheck`, `pnpm lint`, `pnpm format`, and targeted reads otherwise. Leave real builds to the user or CI.
- **UI work is verified visually, not by assertion**: build the mock, serve it, and screenshot the affected page at 1440 / 1024 / 768 / 390 in both themes (`?theme=light` / `?theme=dark` force a theme) before claiming a layout is correct.

## Contribution & Workflow Guidelines

- Keep the project positioning, scope, and tech stack above as the source of truth for all changes.
- Preserve the static-generation, dynamic-window, and automation principles in every modification.
- **UI changes must use the documented tokens and recipes.** Do not reintroduce React, shadcn/ui, a component library, an icon package or a second radius/accent; do not add raw hex values inside components.
- **Do not add scroll-triggered fades, parallax or scroll-jacking.** Entrance happens once, on load; only the canvas field and the data-drawing animations move without a pointer.
- Every animation needs a `prefers-reduced-motion` branch, and every new control needs a visible `:focus-visible` state and a ≥44px target.
- Product decisions (language catalog parity, star tiers, window, framework catalogs, section order) are reflected in user-facing copy — keep the methodology page, FAQ, section descriptions and insight cards in sync with code changes.
- Do not run the real `pnpm build` or `pnpm dev` proactively: the GitHub star fetch is slow and rate-limited, so real builds are the user's or CI's job. Use `pnpm build:mock` / `pnpm dev:mock` for local rendering checks and never deploy their output (details under Local Development).

## Initialization

As a contributor to `trending`, you must respect the Project Overview, Positioning, Tech Stack, Design System and Core Principles above, and ensure your changes remain within the defined language scope, data-source constraints and interface rules.
