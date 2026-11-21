<script lang="ts">
  import { spring } from "svelte/motion"

  import { formatFull, formatPercent } from "@/lib/format"
  import { STAR_TIERS, type TierId, type TierRanking } from "@/lib/tiers"

  interface Props {
    tiers: Record<TierId, TierRanking>
  }

  let { tiers }: Props = $props()

  let active = $state<TierId>("ge2")
  let tabbar = $state<HTMLDivElement | null>(null)

  const prefersReduced =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null

  // A spring, not a transition: the indicator can be grabbed mid-flight by a
  // second click and it retargets from its current position and velocity.
  const x = spring(0, { stiffness: 0.17, damping: 0.72 })
  const w = spring(0, { stiffness: 0.17, damping: 0.72 })

  function measure(hard = false) {
    const el = tabbar?.querySelector<HTMLButtonElement>(
      `[data-tier="${active}"]`
    )
    if (!el) return
    x.set(el.offsetLeft, { hard })
    w.set(el.offsetWidth, { hard })
  }

  function select(id: TierId) {
    if (id === active) return
    active = id
  }

  function tabButtons(): HTMLButtonElement[] {
    return tabbar
      ? Array.from(tabbar.querySelectorAll<HTMLButtonElement>("[role=tab]"))
      : []
  }

  function onKeydown(event: KeyboardEvent, index: number) {
    const last = STAR_TIERS.length - 1
    let next: number

    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1
    else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1
    else if (event.key === "Home") next = 0
    else if (event.key === "End") next = last
    else return

    event.preventDefault()
    select(STAR_TIERS[next].id)
    tabButtons()[next]?.focus()
  }

  // `measure` reads `active`, so this effect re-runs on every tier change.
  $effect(() => {
    measure(prefersReduced?.matches ?? false)
  })

  $effect(() => {
    if (!tabbar) return
    const resize = new ResizeObserver(() => measure(true))
    resize.observe(tabbar)
    measure(true)
    document.fonts?.ready.then(() => measure(true))
    return () => resize.disconnect()
  })
</script>

{#snippet languageTable(items: TierRanking["ranked"], offset: number)}
  <table class:continuation={offset > 0}>
    <thead>
      <tr>
        <th class="col-rank" scope="col">№</th>
        <th scope="col">Language</th>
        <th class="col-count" scope="col">Repositories</th>
        <th class="col-share" scope="col">Share of tier</th>
      </tr>
    </thead>
    <tbody>
      {#each items as language, index (language.id)}
        <tr>
          <td class="col-rank">
            <span
              class="num text-[0.8125rem]"
              class:text-accent={language.rank <= 3}
              class:text-ink-faint={language.rank > 3}
            >
              {String(language.rank).padStart(2, "0")}
            </span>
          </td>
          <td class="col-name">
            <span class="flex min-w-0 items-center gap-2.5">
              <span
                class="size-1.5 shrink-0"
                style={`background-color: ${language.color}`}
                aria-hidden="true"
              ></span>
              <span class="truncate text-[0.9375rem] font-medium text-ink">
                {language.name}
              </span>
            </span>
          </td>
          <td class="col-count">
            <span class="num text-[0.875rem] text-ink">
              {formatFull(language.repos)}
            </span>
          </td>
          <td class="col-share">
            <div class="flex items-center gap-3">
              <span class="h-[3px] min-w-10 flex-1 overflow-hidden bg-panel-2">
                <span
                  class="bar"
                  style={`--w:${Math.max(language.share * 100, 1.2).toFixed(2)}%;--i:${offset + index}`}
                ></span>
              </span>
              <span class="num w-11 text-right text-[0.75rem] text-ink-faint">
                {formatPercent(language.share)}
              </span>
            </div>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{/snippet}

<div class="ranking">
  <div class="tabbar material">
    <div class="wrap">
      <div
        class="relative flex gap-1"
        role="tablist"
        aria-label="Star threshold"
        bind:this={tabbar}
      >
        {#each STAR_TIERS as tier, index (tier.id)}
          <button
            type="button"
            role="tab"
            id={`tab-${tier.id}`}
            data-tier={tier.id}
            aria-selected={active === tier.id}
            aria-controls={`panel-${tier.id}`}
            tabindex={active === tier.id ? 0 : -1}
            class="tab"
            class:is-active={active === tier.id}
            onclick={() => select(tier.id)}
            onkeydown={(event) => onKeydown(event, index)}
          >
            <span class="tab-label">{tier.label}</span>
            <span class="tab-count num">
              {formatFull(tiers[tier.id].total)}
            </span>
          </button>
        {/each}

        <span
          class="indicator"
          style={`transform: translateX(${$x.toFixed(2)}px); width: ${$w.toFixed(2)}px`}
          aria-hidden="true"
        ></span>
      </div>
    </div>
  </div>

  <div class="wrap pt-8">
    {#each STAR_TIERS as tier (tier.id)}
      {@const view = tiers[tier.id]}
      {@const splitAt = Math.ceil(view.ranked.length / 2)}
      <div
        id={`panel-${tier.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${tier.id}`}
        class="panel"
        class:swap={active === tier.id}
        hidden={active !== tier.id}
      >
        <div
          class="flex items-baseline justify-between gap-4 border-b border-line pb-3"
        >
          <h3 class="text-title font-semibold text-ink">
            All {view.ranked.length} languages
          </h3>
          <p class="label hidden sm:block">
            Share = % of the {view.label} tier
          </p>
        </div>

        <div class="table-split">
          {@render languageTable(view.ranked.slice(0, splitAt), 0)}
          {@render languageTable(view.ranked.slice(splitAt), splitAt)}
        </div>

        <p class="mt-4 max-w-3xl text-meta leading-relaxed text-ink-faint">
          Forks and mirrors excluded. Each repository counts once, toward the
          primary language GitHub detects for it.
        </p>
      </div>
    {/each}
  </div>
</div>

<style>
  .ranking {
    overflow-anchor: none;
  }

  .tabbar {
    position: sticky;
    top: 3.5rem;
    z-index: 30;
    border-bottom: 1px solid var(--line);
  }

  @media (min-width: 768px) {
    .tabbar {
      top: 4rem;
    }
  }

  .tab {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
    padding: 0.9rem 1rem 1rem;
    border: 0;
    background: none;
    color: var(--ink-faint);
    text-align: left;
    cursor: pointer;
    transition: color 180ms var(--ease-swift);
  }

  .tab:first-child {
    padding-left: 0;
  }

  .tab:hover,
  .tab.is-active {
    color: var(--ink);
  }

  .tab-label {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .tab-count {
    font-size: 0.9375rem;
    line-height: 1;
    color: var(--ink-faint);
  }

  .tab.is-active .tab-count {
    color: var(--accent);
  }

  .indicator {
    position: absolute;
    left: 0;
    bottom: -1px;
    height: 2px;
    background-color: var(--accent);
    will-change: transform, width;
  }

  .panel[hidden] {
    display: none !important;
  }

  .panel.swap {
    animation: panel-in 280ms var(--ease-quart) both;
  }

  @keyframes panel-in {
    from {
      opacity: 0.4;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead th {
    padding: 0.7rem 0.75rem;
    border-bottom: 1px solid var(--line);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 400;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-faint);
    text-align: left;
  }

  tbody tr {
    border-bottom: 1px solid var(--line-soft);
    transition: background-color 160ms var(--ease-swift);
  }

  tbody tr:hover {
    background-color: var(--panel-2);
  }

  tbody td {
    padding: 0.7rem 0.75rem;
  }

  thead th:first-child,
  tbody td:first-child {
    padding-left: 0;
  }

  thead th:last-child,
  tbody td:last-child {
    padding-right: 0;
  }

  .col-count {
    text-align: right;
  }

  .col-share {
    width: 15rem;
  }

  @media (max-width: 767px) {
    thead {
      display: none;
    }

    tbody tr {
      display: grid;
      grid-template-columns: 2rem minmax(0, 1fr) auto;
      align-items: center;
      gap: 0.5rem 0.75rem;
      padding: 0.7rem 0;
    }

    tbody td {
      padding: 0;
    }

    tbody td.col-share {
      grid-column: 2 / -1;
    }

    .col-share {
      width: auto;
    }
  }

  /* One list, split in half: a single column up to the desktop breakpoint,
     two balanced columns above it. */
  .table-split {
    display: grid;
    gap: 0 2.5rem;
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    .continuation thead {
      display: none;
    }
  }

  @media (min-width: 1024px) {
    .table-split {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    /* Fixed columns keep the two halves metrically identical — auto layout
       would let long names in one half resize the other. */
    table {
      table-layout: fixed;
    }

    .col-rank {
      width: 2.25rem;
    }

    .col-count {
      width: 6.5rem;
    }

    .col-share {
      width: 9.5rem;
    }

    thead th,
    tbody td {
      padding-right: 0.5rem;
      padding-left: 0.5rem;
    }

    thead th:first-child,
    tbody td:first-child {
      padding-left: 0;
    }

    thead th:last-child,
    tbody td:last-child {
      padding-right: 0;
    }

    /* Keep the two adjacent header labels from reading as one string. */
    thead th.col-share,
    tbody td.col-share {
      padding-left: 1.25rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .panel.swap {
      animation: none;
    }
  }
</style>
