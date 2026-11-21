/**
 * The curated catalog of JS/TS full-stack frameworks tracked by the index.
 *
 * Per the project positioning, this is a hand-curated list of mainstream,
 * general-purpose meta-frameworks — not an exhaustive registry. Each entry
 * names the npm package whose downloads are counted, and the package is
 * always the framework's *meta-framework* entry point (SvelteKit for Svelte,
 * SolidStart for Solid), never the underlying renderer: `svelte` and
 * `solid-js` are pulled in transitively by tooling and other libraries, so
 * counting them would measure something else entirely.
 *
 * Pure data — no side effects — so both the build pipeline (`npm.ts`) and
 * client-side islands may import it.
 */

export interface JsFrameworkMeta {
  /** Stable slug used as the identifier across the site. */
  id: string
  /** Human-readable display name. */
  name: string
  /** npm package whose downloads are counted — the meta-framework itself. */
  npmPackage: string
  /** Upstream repository. */
  repoUrl: string
  /** Brand color (hex), used for identity swatches. */
  color: string
  /** One-line description of the framework's typical use. */
  blurb: string
}

export const JS_FRAMEWORK_CATALOG: readonly JsFrameworkMeta[] = [
  {
    id: "next",
    name: "Next.js",
    npmPackage: "next",
    repoUrl: "https://github.com/vercel/next.js",
    // The mark is black on white, so the swatch stays light for the dark UI.
    color: "#e4e4e7",
    blurb:
      "React's production meta-framework — routing, rendering, and server actions in one package.",
  },
  {
    id: "astro",
    name: "Astro",
    npmPackage: "astro",
    repoUrl: "https://github.com/withastro/astro",
    color: "#ff5d01",
    blurb:
      "Content-first meta-framework that ships islands of interactivity with no default client JS.",
  },
  {
    id: "sveltekit",
    name: "SvelteKit",
    npmPackage: "@sveltejs/kit",
    repoUrl: "https://github.com/sveltejs/kit",
    color: "#ff3e00",
    blurb:
      "Svelte's official application framework — file-based routing, SSR, and per-host adapters.",
  },
  {
    id: "nuxt",
    name: "Nuxt",
    npmPackage: "nuxt",
    repoUrl: "https://github.com/nuxt/nuxt",
    color: "#00dc82",
    blurb:
      "Vue's full-stack framework — auto-imports, server routes, and hybrid rendering.",
  },
  {
    id: "solidstart",
    name: "SolidStart",
    npmPackage: "@solidjs/start",
    repoUrl: "https://github.com/solidjs/solid-start",
    color: "#446b9e",
    blurb:
      "Solid's meta-framework — fine-grained reactivity with SSR and server functions.",
  },
] as const
