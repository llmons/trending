import { formatCompact, formatFull, formatPercent } from "@/lib/format"

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")

/* ---------------------------------------------------------------- reveal ---
   Bars grow and numbers count up once, the first time they are on screen.
   Nothing fades in on scroll, and nothing is left hidden if scripting fails:
   the `js` class is what arms the animation, and a timeout covers stragglers.
   -------------------------------------------------------------------------- */

type CounterFormat = "full" | "compact" | "percent"

const formatters: Record<CounterFormat, (value: number) => string> = {
  full: formatFull,
  compact: formatCompact,
  percent: formatPercent,
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function countUp(el: HTMLElement) {
  const target = Number(el.dataset.count)
  if (!Number.isFinite(target)) return

  const format = formatters[(el.dataset.countFormat as CounterFormat) ?? "full"]
  if (!format) return

  if (reduceMotion.matches) {
    el.textContent = format(target)
    return
  }

  const delay = Number(el.dataset.countDelay ?? 0)
  const duration = 1000
  const start = performance.now() + delay

  const frame = (now: number) => {
    const progress = Math.min(Math.max((now - start) / duration, 0), 1)
    el.textContent = format(target * easeOutQuart(progress))
    if (progress < 1) {
      requestAnimationFrame(frame)
    } else {
      el.textContent = format(target)
    }
  }

  requestAnimationFrame(frame)
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const el = entry.target as HTMLElement
        observer.unobserve(el)
        if (el.dataset.count === undefined) {
          el.classList.add("is-in")
        } else {
          countUp(el)
        }
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
  )

  document.querySelectorAll<HTMLElement>(".bar, [data-count]").forEach((el) => {
    observer.observe(el)
  })

  window.setTimeout(() => {
    document
      .querySelectorAll<HTMLElement>(".bar:not(.is-in)")
      .forEach((el) => el.classList.add("is-in"))
  }, 4000)
}

/* ----------------------------------------------------------------- header ---
   A scroll edge, not a hard divider: the hairline only appears once content
   is actually passing underneath the bar.
   -------------------------------------------------------------------------- */

const header = document.querySelector<HTMLElement>("[data-header]")
if (header) {
  let scrolled = false
  const update = () => {
    const next = window.scrollY > 8
    if (next === scrolled) return
    scrolled = next
    header.classList.toggle("is-scrolled", scrolled)
  }
  window.addEventListener("scroll", update, { passive: true })
  update()
}

/* ------------------------------------------------------------------- hero ---
   Pointer position feeds a soft light behind the hero. CSS only moves a
   radial gradient; no layout work, no listeners when motion is reduced.
   -------------------------------------------------------------------------- */

const hero = document.querySelector<HTMLElement>("[data-hero]")
if (hero && !reduceMotion.matches) {
  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect()
    hero.style.setProperty(
      "--px",
      `${((event.clientX - rect.left) / rect.width) * 100}%`
    )
    hero.style.setProperty(
      "--py",
      `${((event.clientY - rect.top) / rect.height) * 100}%`
    )
  })
}
