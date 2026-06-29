import { cubicOut } from 'svelte/easing'
import type { TransitionConfig } from 'svelte/transition'

interface RiseInParams {
  distance?: number
  duration?: number
  delay?: number
  index?: number
  stagger?: number
  easing?: (t: number) => number
}

/**
 * Fade + rise-up entrance transition. Pass `index` + `stagger` to cascade
 * a group of elements (each one's delay is `delay + index * stagger`).
 */
export function riseIn(
  node: Element,
  {
    distance = 16,
    duration = 350,
    delay = 0,
    index = 0,
    stagger = 0,
    easing = cubicOut
  }: RiseInParams = {}
): TransitionConfig {
  const targetOpacity = +getComputedStyle(node).opacity || 1

  return {
    delay: delay + index * stagger,
    duration,
    easing,
    css: (t) => `opacity: ${t * targetOpacity}; transform: translateY(${(1 - t) * distance}px)`
  }
}
