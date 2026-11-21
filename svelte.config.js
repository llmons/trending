import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"

/** @type {import('@sveltejs/vite-plugin-svelte').SvelteConfig} */
export default {
  // TypeScript inside `<script lang="ts">` and `<style lang="postcss">`.
  preprocess: vitePreprocess(),
}
