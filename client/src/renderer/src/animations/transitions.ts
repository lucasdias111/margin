import type { TransitionConfig } from 'svelte/transition'
import {
  DURATION,
  EASING,
  motionDistance,
  motionDuration,
  resolveDuration,
  type DurationToken
} from './motion'

interface BaseParams {
  duration?: number | DurationToken
  delay?: number
  easing?: (t: number) => number
  index?: number
  stagger?: number
}

function timing(
  p: BaseParams,
  fallbackDuration: number | DurationToken,
  fallbackEasing: (t: number) => number
): { duration: number; delay: number; easing: (t: number) => number } {
  const stagger = motionDistance(p.stagger ?? 0)
  return {
    duration: motionDuration(resolveDuration(p.duration ?? fallbackDuration)),
    delay: (p.delay ?? 0) + (p.index ?? 0) * stagger,
    easing: p.easing ?? fallbackEasing
  }
}

function baseOpacity(node: Element): number {
  const value = Number.parseFloat(getComputedStyle(node).opacity)
  return Number.isFinite(value) && value > 0 ? value : 1
}

export interface RiseInParams extends BaseParams {
  distance?: number
}

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
  start?: number
  distance?: number
  origin?: string
}

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

export function popIn(node: Element, params: ScaleFadeParams = {}): TransitionConfig {
  return scaleFade(node, {
    start: 0.8,
    duration: DURATION.base,
    easing: EASING.spring,
    ...params
  })
}

export interface SlideParams extends BaseParams {
  from?: 'left' | 'right' | 'top' | 'bottom'
  distance?: number
  fade?: boolean
}

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

export function backdrop(node: Element, params: BaseParams = {}): TransitionConfig {
  const { duration, delay, easing } = timing(params, DURATION.fast, EASING.standard)
  const opacity = baseOpacity(node)
  return { delay, duration, easing, css: (t) => `opacity: ${t * opacity}` }
}

export function modalIn(node: Element, params: ScaleFadeParams = {}): TransitionConfig {
  return scaleFade(node, {
    start: 0.96,
    distance: 12,
    duration: DURATION.slow,
    easing: EASING.standard,
    ...params
  })
}

export function viewIn(node: Element, params: RiseInParams = {}): TransitionConfig {
  return riseIn(node, {
    distance: 10,
    duration: DURATION.base,
    delay: 60,
    easing: EASING.standard,
    ...params
  })
}

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

export function stepIn(node: Element, params: SlideParams = {}): TransitionConfig {
  return slide(node, {
    from: 'right',
    distance: 20,
    duration: DURATION.base,
    easing: EASING.standard,
    ...params
  })
}

export function toastIn(node: Element, params: SlideParams = {}): TransitionConfig {
  return slide(node, {
    from: 'right',
    distance: 32,
    duration: DURATION.slow,
    easing: EASING.spring,
    ...params
  })
}

export function toastOut(node: Element, params: SlideParams = {}): TransitionConfig {
  return slide(node, {
    from: 'right',
    distance: 24,
    duration: DURATION.fast,
    easing: EASING.exit,
    ...params
  })
}

export function listItemIn(node: Element, params: RiseInParams = {}): TransitionConfig {
  return riseIn(node, {
    distance: 8,
    duration: DURATION.base,
    easing: EASING.standard,
    ...params
  })
}

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
