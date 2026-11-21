<script lang="ts">
  /**
   * A field of dots, one per "unit" of the index, with a handful standing out
   * as leaders. The pointer pushes the field aside and it springs back — the
   * only always-on motion on the site, and it stops the moment it leaves the
   * screen, the tab is hidden, or motion is reduced.
   */
  interface Dot {
    x: number
    y: number
    ox: number
    oy: number
    vx: number
    vy: number
    hot: boolean
  }

  const SPACING = 46
  const PUSH_RADIUS = 190

  let host = $state<HTMLDivElement | null>(null)
  let canvas = $state<HTMLCanvasElement | null>(null)

  $effect(() => {
    const hostEl = host
    const canvasEl = canvas
    if (!hostEl || !canvasEl) return

    // Explicitly typed so the narrowed type survives into the nested helpers.
    const box: HTMLDivElement = hostEl
    const surface: HTMLCanvasElement = canvasEl

    const drawing = surface.getContext("2d")
    if (!drawing) return
    const ctx: CanvasRenderingContext2D = drawing

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    const pointer = { x: -9999, y: -9999, active: false }

    let dots: Dot[] = []
    let width = 0
    let height = 0
    let frame = 0
    let visible = true
    let colors = { line: "#d8d3c7", accent: "#1f6ed4" }

    function readColors() {
      const styles = getComputedStyle(box)
      colors = {
        line: styles.getPropertyValue("--line").trim() || colors.line,
        accent: styles.getPropertyValue("--accent").trim() || colors.accent,
      }
    }

    function build() {
      const rect = box.getBoundingClientRect()
      width = Math.max(rect.width, 1)
      height = Math.max(rect.height, 1)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      surface.width = Math.round(width * dpr)
      surface.height = Math.round(height * dpr)
      surface.style.width = `${width}px`
      surface.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      let spacing = SPACING
      let cols = Math.ceil(width / spacing) + 1
      let rows = Math.ceil(height / spacing) + 1
      while (cols * rows > 1500) {
        spacing *= 1.15
        cols = Math.ceil(width / spacing) + 1
        rows = Math.ceil(height / spacing) + 1
      }

      dots = []
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          dots.push({
            x: col * spacing,
            y: row * spacing,
            ox: 0,
            oy: 0,
            vx: 0,
            vy: 0,
            // A sparse, stable subset reads as "the leaders".
            hot: (row * 7 + col * 11) % 43 === 0,
          })
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height)
      for (const dot of dots) {
        const x = dot.x + dot.ox
        const y = dot.y + dot.oy
        ctx.beginPath()
        ctx.arc(x, y, dot.hot ? 1.9 : 1.1, 0, Math.PI * 2)
        ctx.fillStyle = dot.hot ? colors.accent : colors.line
        ctx.globalAlpha = dot.hot ? 0.75 : 0.72
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    function tick(now: number) {
      for (const dot of dots) {
        let tx = 0
        let ty = Math.sin(dot.x * 0.009 + now * 0.0006) * 2

        if (pointer.active) {
          const dx = dot.x + dot.ox - pointer.x
          const dy = dot.y + dot.oy - pointer.y
          const distance = Math.hypot(dx, dy)
          if (distance < PUSH_RADIUS) {
            const falloff = 1 - distance / PUSH_RADIUS
            const push = falloff * falloff * 24
            tx += (dx / (distance || 1)) * push
            ty += (dy / (distance || 1)) * push
          }
        }

        dot.vx = (dot.vx + (tx - dot.ox) * 0.09) * 0.86
        dot.vy = (dot.vy + (ty - dot.oy) * 0.09) * 0.86
        dot.ox += dot.vx
        dot.oy += dot.vy
      }
      draw()
      frame = requestAnimationFrame(tick)
    }

    function start() {
      if (reduce.matches) {
        draw()
        return
      }
      if (frame) return
      frame = requestAnimationFrame(tick)
    }

    function stop() {
      cancelAnimationFrame(frame)
      frame = 0
    }

    function onPointerMove(event: PointerEvent) {
      const rect = box.getBoundingClientRect()
      const inside =
        event.clientX > rect.left - PUSH_RADIUS &&
        event.clientX < rect.right + PUSH_RADIUS &&
        event.clientY > rect.top - PUSH_RADIUS &&
        event.clientY < rect.bottom + PUSH_RADIUS
      pointer.active = inside
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
    }

    function onPointerLeave() {
      pointer.active = false
    }

    build()
    readColors()

    const resize = new ResizeObserver(() => {
      build()
      if (reduce.matches) draw()
    })
    resize.observe(box)

    const theme = new MutationObserver(() => {
      readColors()
      if (reduce.matches) draw()
    })
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    const viewport = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (visible && !document.hidden) start()
        else stop()
      },
      { threshold: 0 }
    )
    viewport.observe(box)

    const onVisibility = () => {
      if (document.hidden) stop()
      else if (visible) start()
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("pointerdown", onPointerMove, { passive: true })
    document.addEventListener("pointerleave", onPointerLeave)
    document.addEventListener("visibilitychange", onVisibility)

    if (visible) start()

    return () => {
      stop()
      resize.disconnect()
      theme.disconnect()
      viewport.disconnect()
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerdown", onPointerMove)
      document.removeEventListener("pointerleave", onPointerLeave)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  })
</script>

<div
  bind:this={host}
  class="pointer-events-none absolute inset-0"
  aria-hidden="true"
>
  <canvas bind:this={canvas} class="block h-full w-full opacity-70"></canvas>
</div>
