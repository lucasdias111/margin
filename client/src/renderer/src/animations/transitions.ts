/**
 * Reusable `svelte/transition` functions built on the {@link DURATION} /
 * {@link EASING} tokens.
 *
 * All of them honour `prefers-reduced-motion` by dropping the movement and
 * keeping a short fade, so callers never have to think about it.
 */

import type { TransitionConfig } from 'svelte/transition'
import {
  DURATION,
  EASING,
  motionDistance,
  motionDuration,
  resolveDuration,
  type DurationToken
} from './motion'

/** Options every transition here understands. */
interface BaseParams {
  duration?: number | DurationToken
  delay?: number
  easing?: (t: number) => number
  /** Position in a group; the delay becomes `delay + index * stagger`. */
  index?: number
  /** Per-item delay for a staggered group, in ms. */
  stagger?: number
}

function timing(
  p: BaseParams,
  fallbackDuration: number | DurationToken,
  fallbackEasing: (t: number) => number
): { duration: number; delay: number; easing: (t: number) => number } {
  const stagger = motionDistance(p.stagger ?? 0) // stagger collapses with motion
  return {
    duration: motionDuration(resolveDuration(p.duration ?? fallbackDuration)),
    delay: (p.delay ?? 0) + (p.index ?? 0) * stagger,
    easing: p.easing ?? fallbackEasing
  }
}

/** Opacity the node settles at, so we never fade a half-transparent thing to 1. */
function baseOpacity(node: Element): number {
  const value = Number.parseFloat(getComputedStyle(node).opacity)
  return Number.isFinite(value) && value > 0 ? value : 1
}

export interface RiseInParams extends BaseParams {
  /** How far below its resting place the element starts, in px. */
  distance?: number
}

/**
 * Fade + rise-up entrance. The default for content appearing in place:
 * cards, list sections, empty states.
 */
export function riseIn(node: Element, params: RiseInParams = {}): TransitionConfig {
  const { duration, delay, easing } = timing(params, DURATION.slow, EASING.standard)
  const distance = motionDistance(params.distance ?? 16)
  const opacity = baseOpacity(node)

  return {
    delay,
    duration,
    easing,
    css: (t) => `opacity: ${t * opacity}; transform: translate3d(0, ${(1 - t) * distance}px, 0)`
  }
}

export interface ScaleFadeParams extends BaseParams {
  /** Scale the element starts (or ends) at. */
  start?: number
  /** Optional vertical nudge, in px — pairs well with a popover's origin. */
  distance?: number
  /** `transform-origin`, e.g. `'top left'` for a dropdown under its trigger. */
  origin?: string
}

/**
 * Scale + fade. The iOS popover feel — menus, dropdowns, pickers, tooltips.
 * Set `origin` to the corner the surface is anchored to.
 */
export function scaleFade(node: Element, params: ScaleFadeParams = {}): TransitionConfig {
  const { duration, delay, easing } = timing(params, DURATION.fast, EASING.standard)
  const start = params.start ?? 0.94
  const distance = motionDistance(params.distance ?? 0)
  const opacity = baseOpacity(node)
  const origin = params.origin

  if (origin) (node as HTMLElement).style.transformOrigin = origin

  return {
    delay,
    duration,
    easing,
    css: (t) => {
      const scale = start + (1 - start) * t
      return `opacity: ${t * opacity}; transform: translate3d(0, ${(1 - t) * distance}px, 0) scale(${scale})`
    }
  }
}

/**
 * Scale + fade with a soft overshoot. For things that should feel like they
 * *landed*: confirmation states, unread badges, newly sent messages.
 */
export function popIn(node: Element, params: ScaleFadeParams = {}): TransitionConfig {
  return scaleFade(node, {
    start: 0.8,
    duration: DURATION.base,
    easing: EASING.spring,
    ...params
  })
}

export interface SlideParams extends BaseParams {
  /** Side the element travels from (on `in:`) or towards (on `out:`). */
  from?: 'left' | 'right' | 'top' | 'bottom'
  /** Travel distance in px. */
  distance?: number
  /** Fade alongside the movement. */
  fade?: boolean
}

/** Directional slide, for panes and sheets that come in from an edge. */
export function slide(node: Element, params: SlideParams = {}): TransitionConfig {
  const { duration, delay, easing } = timing(params, DURATION.slow, EASING.standard)
  const distance = motionDistance(params.distance ?? 24)
  const from = params.from ?? 'right'
  const fade = params.fade ?? true
  const opacity = baseOpacity(node)

  const axis = from === 'left' || from === 'right' ? 'X' : 'Y'
  const sign = from === 'left' || from === 'top' ? -1 : 1

  return {
    delay,
    duration,
    easing,
    css: (t) => {
      const offset = (1 - t) * distance * sign
      const shift = axis === 'X' ? `${offset}px, 0` : `0, ${offset}px`
      return `${fade ? `opacity: ${t * opacity};` : ''} transform: translate3d(${shift}, 0)`
    }
  }
}

/**
 * The dimmed layer behind a modal. A plain fade, deliberately faster on the way
 * out so the app underneath comes back promptly.
 */
export function backdrop(node: Element, params: BaseParams = {}): TransitionConfig {
  const { duration, delay, easing } = timing(params, DURATION.fast, EASING.standard)
  const opacity = baseOpacity(node)
  return { delay, duration, easing, css: (t) => `opacity: ${t * opacity}` }
}

/**
 * The modal surface itself: rises slightly and scales up from just under full
 * size, the way a sheet presents on iOS.
 */
export function modalIn(node: Element, params: ScaleFadeParams = {}): TransitionConfig {
  return scaleFade(node, {
    start: 0.96,
    distance: 12,
    duration: DURATION.slow,
    easing: EASING.standard,
    ...params
  })
}

/**
 * Cross-fade between two sibling views that occupy the same box — tabs, view
 * switches, route swaps. The outgoing copy is taken out of flow so the two
 * never fight over layout.
 *
 * Usage: `{#key view}<div in:viewIn out:viewOut>…</div>{/key}`
 */
export function viewIn(node: Element, params: RiseInParams = {}): TransitionConfig {
  return riseIn(node, {
    distance: 10,
    duration: DURATION.base,
    delay: 60, // let the outgoing view clear first
    easing: EASING.standard,
    ...params
  })
}

/** Partner to {@link viewIn}: a quick fade-and-settle for the leaving view. */
export function viewOut(node: Element, params: RiseInParams = {}): TransitionConfig {
  const { duration, delay, easing } = timing(
    { duration: DURATION.fast, easing: EASING.exit, ...params },
    DURATION.fast,
    EASING.exit
  )
  const distance = motionDistance(params.distance ?? 6)
  const opacity = baseOpacity(node)

  return {
    delay,
    duration,
    easing,
    css: (t) => `opacity: ${t * opacity}; transform: translate3d(0, ${(1 - t) * -distance}px, 0)`
  }
}

/**
 * Entrance for a step inside a multi-step surface — a modal wizard, a settings
 * drill-down. Slides in from the side like an iOS navigation push.
 *
 * Pair with `{#key step}` and use `in:` only: leaving the old step in place
 * would fight the surface's content-driven height.
 */
export function stepIn(node: Element, params: SlideParams = {}): TransitionConfig {
  return slide(node, {
    from: 'right',
    distance: 20,
    duration: DURATION.base,
    easing: EASING.standard,
    ...params
  })
}

/**
 * A toast sliding in from the right with a little spring, then leaving the way
 * it came — but faster and without the bounce.
 */
export function toastIn(node: Element, params: SlideParams = {}): TransitionConfig {
  return slide(node, {
    from: 'right',
    distance: 32,
    duration: DURATION.slow,
    easing: EASING.spring,
    ...params
  })
}

/** Partner to {@link toastIn}. */
export function toastOut(node: Element, params: SlideParams = {}): TransitionConfig {
  return slide(node, {
    from: 'right',
    distance: 24,
    duration: DURATION.fast,
    easing: EASING.exit,
    ...params
  })
}

/**
 * Entrance for a row appearing in a list. Small distance on purpose: rows are
 * dense, and a big travel turns an arriving message into a distraction.
 */
export function listItemIn(node: Element, params: RiseInParams = {}): TransitionConfig {
  return riseIn(node, {
    distance: 8,
    duration: DURATION.base,
    easing: EASING.standard,
    ...params
  })
}

/** Collapse-and-fade for a row leaving a list, so neighbours close the gap. */
export function listItemOut(node: Element, params: BaseParams = {}): TransitionConfig {
  const { duration, delay, easing } = timing(params, DURATION.fast, EASING.exit)
  const el = node as HTMLElement
  const style = getComputedStyle(el)
  const height = el.offsetHeight
  const marginTop = Number.parseFloat(style.marginTop) || 0
  const marginBottom = Number.parseFloat(style.marginBottom) || 0
  const opacity = baseOpacity(node)

  return {
    delay,
    duration,
    easing,
    css: (t) =>
      `overflow: hidden;` +
      `opacity: ${t * opacity};` +
      `height: ${t * height}px;` +
      `margin-top: ${t * marginTop}px;` +
      `margin-bottom: ${t * marginBottom}px;` +
      `transform: scale(${0.96 + 0.04 * t})`
  }
}
