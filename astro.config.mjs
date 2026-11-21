// @ts-check

import svelte from "@astrojs/svelte"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"

// Local mock data (`pnpm build:mock`) must never reach a deployed build: fail
// at config load, before any output is produced. `src/lib/data.ts` repeats the
// check at runtime as a second line of defence.
if (
  process.env.TRENDING_MOCK === "1" &&
  (process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true")
) {
  throw new Error(
    "TRENDING_MOCK is local-only — CI must fetch the real GitHub counts."
  )
}

// https://astro.build/config
export default defineConfig({
  site: process.env.ASTRO_SITE ?? "https://llmons.github.io",
  base: process.env.ASTRO_BASE ?? "/",
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [svelte()],
})
