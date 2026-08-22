export const DURATION = {
  instant: 120,
  fast: 180,
  base: 240,
  slow: 320,
  slower: 440
} as const

export type DurationToken = keyof typeof DURATION

export const BEZIER = {
  standard: [0.32, 0.72, 0, 1],
  exit: [0.4, 0, 1, 1],
  inOut: [0.65, 0, 0.35, 1],
  spring: [0.34, 1.56, 0.64, 1],
  bounce: [0.22, 1.61, 0.36, 1]
} as const

export type BezierToken = keyof typeof BEZIER

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
    if (x1 === y1 && x2 === y2) return x

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

export const EASING = {
  standard: cubicBezier(...BEZIER.standard),
  exit: cubicBezier(...BEZIER.exit),
  inOut: cubicBezier(...BEZIER.inOut),
  spring: cubicBezier(...BEZIER.spring),
  bounce: cubicBezier(...BEZIER.bounce)
} as const satisfies Record<BezierToken, (t: number) => number>

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

export function prefersReducedMotion(): boolean {
  return query()?.matches ?? false
}

export function onReducedMotionChange(handler: (reduced: boolean) => void): () => void {
  const mq = query()
  if (!mq) return () => {}
  const listener = (e: MediaQueryListEvent): void => handler(e.matches)
  mq.addEventListener('change', listener)
  return () => mq.removeEventListener('change', listener)
}

export function motionDuration(ms: number): number {
  return prefersReducedMotion() ? Math.min(ms, 80) : ms
}

export function motionDistance(px: number): number {
  return prefersReducedMotion() ? 0 : px
}

export function resolveDuration(value: number | DurationToken): number {
  return typeof value === 'number' ? value : DURATION[value]
}
