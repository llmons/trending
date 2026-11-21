<script lang="ts">
  import { FAQS } from "@/lib/faq"

  let open = $state<number[]>([])

  function isOpen(index: number) {
    return open.includes(index)
  }

  function toggle(index: number) {
    open = isOpen(index)
      ? open.filter((item) => item !== index)
      : [...open, index]
  }
</script>

<div class="mt-8 border-t border-line">
  {#each FAQS as faq, index (faq.question)}
    <div class="border-b border-line">
      <h3>
        <button
          type="button"
          id={`faq-question-${index}`}
          aria-expanded={isOpen(index)}
          aria-controls={`faq-answer-${index}`}
          class="group flex w-full items-baseline justify-between gap-6 py-5 text-left"
          onclick={() => toggle(index)}
        >
          <span
            class="max-w-2xl text-[1.0625rem] leading-snug font-medium text-ink transition-colors group-hover:text-accent"
          >
            {faq.question}
          </span>
          <span
            class="plus shrink-0"
            class:open={isOpen(index)}
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
        </button>
      </h3>

      <div
        id={`faq-answer-${index}`}
        role="region"
        aria-labelledby={`faq-question-${index}`}
        class="answer"
        class:is-open={isOpen(index)}
      >
        <div class="overflow-hidden">
          <p class="max-w-2xl pb-6 text-meta leading-relaxed text-ink-soft">
            {faq.answer}
          </p>
        </div>
      </div>
    </div>
  {/each}
</div>

<style>
  .plus {
    display: grid;
    place-items: center;
    color: var(--ink-faint);
    transition:
      transform 260ms var(--ease-quart),
      color 160ms var(--ease-swift);
  }

  .plus.open {
    transform: rotate(135deg);
    color: var(--accent);
  }

  .answer {
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    transition:
      grid-template-rows 320ms var(--ease-quart),
      opacity 240ms var(--ease-swift);
  }

  .answer.is-open {
    grid-template-rows: 1fr;
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .answer {
      transition: none;
    }

    .plus {
      transition: none;
    }
  }
</style>
