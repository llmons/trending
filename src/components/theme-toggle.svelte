<script lang="ts">
  const STORAGE_KEY = "trending:theme"

  let dark = $state(true)

  function sync() {
    dark = document.documentElement.classList.contains("dark")
  }

  function toggle() {
    const next = !dark
    document.documentElement.classList.toggle("dark", next)
    document.documentElement.style.colorScheme = next ? "dark" : "light"
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light")
    } catch {
      // Private browsing / disabled storage — the toggle still works for the session.
    }
    dark = next
  }

  $effect(() => {
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  })
</script>

<button
  type="button"
  class="theme-toggle relative grid size-11 shrink-0 place-items-center text-ink-soft transition-colors duration-150 hover:text-ink active:scale-95"
  aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
  title={dark ? "Switch to light theme" : "Switch to dark theme"}
  onclick={toggle}
>
  <span class="theme-icon moon">
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.2 8.2 0 1 0 20 14.2Z" />
    </svg>
  </span>
  <span class="theme-icon sun">
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
      />
    </svg>
  </span>
</button>

<style>
  .theme-toggle {
    background: none;
    border: 0;
    cursor: pointer;
  }

  .theme-icon {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    transition:
      opacity 200ms var(--ease-swift),
      transform 360ms var(--ease-quart);
  }

  .moon {
    opacity: 1;
    transform: rotate(0deg) scale(1);
  }

  .sun {
    opacity: 0;
    transform: rotate(-70deg) scale(0.55);
  }

  :global(.dark) .moon {
    opacity: 0;
    transform: rotate(70deg) scale(0.55);
  }

  :global(.dark) .sun {
    opacity: 1;
    transform: rotate(0deg) scale(1);
  }
</style>
