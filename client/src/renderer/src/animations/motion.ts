/**
 * Motion tokens — the single source of truth for how things move in margin.
 *
 * Every duration/easing used by a transition, an action or a stylesheet comes
 * from here, so the whole app accelerates and settles on the same curves.
 * The bezier control points are shared between JS (Svelte transitions) and CSS
 * (`motion.css` custom properties) so both halves stay in sync.
 */

/** Durations in ms. Keep the ladder short — more steps just means less rhythm. */
export const DURATION = {
  /** Micro-feedback: press states, icon swaps. */
  instant: 120,
  /** Hovers, small reveals, tooltips. */
  fast: 180,
  /** The default: dropdowns, list items, tab swaps. */
  base: 240,
  /** Modals, panels, anything with real surface area. */
  slow: 320,
  /** Full-page / route level. */
  slower: 440
} as const

export type DurationToken = keyof typeof DURATION

/** Cubic-bezier control points, shared with `motion.css`. */
export const BEZIER = {
  /** Apple's workhorse curve: quick off the line, long glide into place. */
  standard: [0.32, 0.72, 0, 1],
  /** For things leaving the screen — starts slow, exits with intent. */
  exit: [0.4, 0, 1, 1],
  /** Symmetric, for moves that start and end on screen. */
  inOut: [0.65, 0, 0.35, 1],
  /** Gentle overshoot. Badges, toggles, confirmations. */
  spring: [0.34, 1.56, 0.64, 1],
  /** Aggressive overshoot. Use sparingly — one accent per screen. */
  bounce: [0.22, 1.61, 0.36, 1]
} as const

export type BezierToken = keyof typeof BEZIER

/**
 * Numeric solver for a CSS cubic-bezier, so a Svelte transition can use the
 * exact curve its CSS counterpart uses. Newton-Raphson with a bisection
 * fallback — accurate to ~1e-6 within a couple of iterations.
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const a = (a1: number, a2: number): number => 1 - 3 * a2 + 3 * a1
  const b = (a1: number, a2: number): number => 3 * a2 - 6 * a1
  const c = (a1: number): number => 3 * a1

  const calc = (t: number, a1: number, a2: number): number =>
    ((a(a1, a2) * t + b(a1, a2)) * t + c(a1)) * t
  const slope = (t: number, a1: number, a2: number): number =>
    3 * a(a1, a2) * t * t + 2 * b(a1, a2) * t + c(a1)

  return (x: number): number => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    if (x1 === y1 && x2 === y2) return x // linear shortcut

    let t = x
    for (let i = 0; i < 8; i++) {
      const err = calc(t, x1, x2) - x
      if (Math.abs(err) < 1e-6) return calc(t, y1, y2)
      const d = slope(t, x1, x2)
      if (Math.abs(d) < 1e-6) break
      t -= err / d
    }

    let lo = 0
    let hi = 1
    t = x
    while (lo < hi) {
      const err = calc(t, x1, x2)
      if (Math.abs(err - x) < 1e-6) break
      if (err > x) hi = t
      else lo = t
      t = (hi + lo) / 2
    }
    return calc(t, y1, y2)
  }
}

/** Easing functions for `svelte/transition`, one per {@link BEZIER} token. */
export const EASING = {
  standard: cubicBezier(...BEZIER.standard),
  exit: cubicBezier(...BEZIER.exit),
  inOut: cubicBezier(...BEZIER.inOut),
  spring: cubicBezier(...BEZIER.spring),
  bounce: cubicBezier(...BEZIER.bounce)
} as const satisfies Record<BezierToken, (t: number) => number>

/** The same curves as CSS strings, for inline styles and `style:` directives. */
export const CSS_EASING = Object.fromEntries(
  Object.entries(BEZIER).map(([name, [x1, y1, x2, y2]]) => [
    name,
    `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`
  ])
) as Record<BezierToken, string>

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

let reducedMotionQuery: MediaQueryList | null = null

function query(): MediaQueryList | null {
  if (typeof window === 'undefined' || !window.matchMedia) return null
  if (!reducedMotionQuery) reducedMotionQuery = window.matchMedia(REDUCED_MOTION_QUERY)
  return reducedMotionQuery
}

/** True when the OS asks us to tone motion down. Re-read on every use. */
export function prefersReducedMotion(): boolean {
  return query()?.matches ?? false
}

/** Subscribe to reduced-motion changes. Returns an unsubscribe function. */
export function onReducedMotionChange(handler: (reduced: boolean) => void): () => void {
  const mq = query()
  if (!mq) return () => {}
  const listener = (e: MediaQueryListEvent): void => handler(e.matches)
  mq.addEventListener('change', listener)
  return () => mq.removeEventListener('change', listener)
}

/**
 * Collapse a duration when the user prefers reduced motion. We keep a sliver of
 * time rather than zero so cross-fades still read as a change of state instead
 * of a jump cut.
 */
export function motionDuration(ms: number): number {
  return prefersReducedMotion() ? Math.min(ms, 80) : ms
}

/** Zero out a distance/scale delta under reduced motion, keeping opacity work. */
export function motionDistance(px: number): number {
  return prefersReducedMotion() ? 0 : px
}

/** Resolve a duration token (or a raw ms number) to milliseconds. */
export function resolveDuration(value: number | DurationToken): number {
  return typeof value === 'number' ? value : DURATION[value]
}
