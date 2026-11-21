<script lang="ts">
  import { tick } from "svelte"
  import { cubicOut } from "svelte/easing"
  import { fly } from "svelte/transition"

  import type { NavLink } from "@/lib/nav"

  interface Props {
    links: NavLink[]
    sourceHref: string
  }

  let { links, sourceHref }: Props = $props()

  let open = $state(false)
  let trigger = $state<HTMLButtonElement | null>(null)
  let sheet = $state<HTMLDivElement | null>(null)

  function close(restoreFocus = true) {
    open = false
    if (restoreFocus) trigger?.focus()
  }

  async function reveal() {
    open = true
    await tick()
    sheet?.querySelector<HTMLElement>("a, button")?.focus()
  }

  $effect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) close()
    }
    const desktop = window.matchMedia("(min-width: 768px)")
    const onChange = () => {
      if (desktop.matches) open = false
    }

    window.addEventListener("keydown", onKey)
    desktop.addEventListener("change", onChange)
    return () => {
      window.removeEventListener("keydown", onKey)
      desktop.removeEventListener("change", onChange)
    }
  })

  $effect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  })
</script>

<button
  type="button"
  class="grid size-11 place-items-center text-ink-soft transition-colors duration-150 hover:text-ink active:scale-95 md:hidden"
  aria-expanded={open}
  aria-controls="mobile-nav"
  bind:this={trigger}
  onclick={reveal}
>
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    aria-hidden="true"
  >
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
  <span class="sr-only">Open navigation</span>
</button>

{#if open}
  <div
    id="mobile-nav"
    class="fixed inset-0 z-[60] flex flex-col bg-canvas md:hidden"
    role="dialog"
    aria-modal="true"
    aria-label="Site navigation"
    bind:this={sheet}
    transition:fly={{ y: -24, duration: 320, easing: cubicOut }}
  >
    <div
      class="wrap flex h-14 shrink-0 items-center justify-between border-b border-line"
    >
      <span
        class="font-mono text-[0.6875rem] tracking-[0.24em] text-ink-faint uppercase"
      >
        Menu
      </span>
      <button
        type="button"
        class="grid size-11 place-items-center text-ink-soft transition-colors hover:text-ink active:scale-95"
        onclick={() => close()}
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
        <span class="sr-only">Close navigation</span>
      </button>
    </div>

    <nav class="wrap mt-2 flex-1 overflow-y-auto" aria-label="Primary">
      <ul class="border-t border-line-soft">
        {#each links as link, index (link.href)}
          <li class="border-b border-line-soft">
            <a
              href={link.href}
              class="group flex items-baseline gap-4 py-4 transition-colors"
              onclick={() => close(false)}
            >
              <span class="num w-6 text-[0.6875rem] text-ink-faint">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                class="text-[1.375rem] leading-none font-medium tracking-[-0.02em] text-ink"
              >
                {link.label}
              </span>
              <svg
                class="ml-auto size-4 self-center text-ink-faint transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1 group-hover:text-ink"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M4 12h15" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </a>
          </li>
        {/each}
      </ul>
    </nav>

    <div class="wrap shrink-0 py-6">
      <a
        href={sourceHref}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] tracking-[0.14em] text-ink-faint uppercase transition-colors hover:text-ink"
      >
        Live GitHub search
        <svg
          viewBox="0 0 24 24"
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M7 17 17 7" />
          <path d="M8 7h9v9" />
        </svg>
      </a>
    </div>
  </div>
{/if}
