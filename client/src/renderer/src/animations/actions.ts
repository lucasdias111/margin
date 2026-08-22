/**
 * Svelte actions for motion that reacts to input rather than to mount/unmount.
 *
 * These drive CSS transforms directly instead of animating through Svelte, so
 * they stay on the compositor and keep working while a component re-renders.
 */

import { CSS_EASING, DURATION, prefersReducedMotion } from './motion'

export interface PressableParams {
  /** Scale at the bottom of the press. */
  scale?: number
  /** Turn the effect off without removing the action. */
  disabled?: boolean
}

/**
 * The iOS press: the surface dips under your finger and springs back when you
 * let go. Attach to any clickable element.
 *
 * ```svelte
 * <button use:pressable>…</button>
 * <div use:pressable={{ scale: 0.98 }}>…</div>
 * ```
 */
export function pressable(
  node: HTMLElement,
  params: PressableParams = {}
): { update: (p: PressableParams) => void; destroy: () => void } {
  let scale = params.scale ?? 0.96
  let disabled = params.disabled ?? false
  let pressed = false

  const release = (): void => {
    if (!pressed) return
    pressed = false
    node.style.transform = ''
    node.style.transitionDuration = `${DURATION.base}ms`
    node.style.transitionTimingFunction = CSS_EASING.spring
  }

  const press = (): void => {
    if (disabled || pressed || prefersReducedMotion()) return
    if (node.hasAttribute('disabled')) return
    pressed = true
    node.style.transitionProperty = 'transform'
    node.style.transitionDuration = `${DURATION.instant}ms`
    node.style.transitionTimingFunction = CSS_EASING.standard
    node.style.transform = `scale(${scale})`
  }

  node.addEventListener('pointerdown', press)
  node.addEventListener('pointerup', release)
  node.addEventListener('pointercancel', release)
  node.addEventListener('pointerleave', release)
  node.addEventListener('blur', release)

  return {
    update(next: PressableParams) {
      scale = next.scale ?? 0.96
      disabled = next.disabled ?? false
      if (disabled) release()
    },
    destroy() {
      node.removeEventListener('pointerdown', press)
      node.removeEventListener('pointerup', release)
      node.removeEventListener('pointercancel', release)
      node.removeEventListener('pointerleave', release)
      node.removeEventListener('blur', release)
    }
  }
}

export interface StaggerParams {
  /** Delay added per child, in ms. */
  step?: number
  /** Delay before the first child, in ms. */
  delay?: number
  /** Cap the cascade so a long list doesn't take seconds to finish. */
  max?: number
}

/**
 * Sets `--stagger-delay` on each child so a CSS `animation-delay` (see the
 * `.motion-cascade` helper in `motion.css`) cascades down the list. Re-runs
 * whenever children are added or removed.
 *
 * ```svelte
 * <ul use:stagger={{ step: 40 }}>
 *   {#each items as item}<li class="motion-cascade">…</li>{/each}
 * </ul>
 * ```
 */
export function stagger(
  node: HTMLElement,
  params: StaggerParams = {}
): { update: (p: StaggerParams) => void; destroy: () => void } {
  let step = params.step ?? 35
  let delay = params.delay ?? 0
  let max = params.max ?? 12

  const apply = (): void => {
    const reduced = prefersReducedMotion()
    Array.from(node.children).forEach((child, i) => {
      const slot = Math.min(i, max)
      const ms = reduced ? 0 : delay + slot * step
      ;(child as HTMLElement).style.setProperty('--stagger-delay', `${ms}ms`)
    })
  }

  apply()
  const observer = new MutationObserver(apply)
  observer.observe(node, { childList: true })

  return {
    update(next: StaggerParams) {
      step = next.step ?? 35
      delay = next.delay ?? 0
      max = next.max ?? 12
      apply()
    },
    destroy() {
      observer.disconnect()
    }
  }
}

export interface HoverLiftParams {
  /** How far the element rises on hover, in px. */
  lift?: number
  /** Optional scale applied alongside the lift. */
  scale?: number
  disabled?: boolean
}

/**
 * Lifts an element towards the cursor on hover. Use on cards and tiles — not on
 * dense list rows, where a background change reads better than movement.
 */
export function hoverLift(
  node: HTMLElement,
  params: HoverLiftParams = {}
): { update: (p: HoverLiftParams) => void; destroy: () => void } {
  let lift = params.lift ?? 2
  let scale = params.scale ?? 1
  let disabled = params.disabled ?? false

  const enter = (): void => {
    if (disabled || prefersReducedMotion()) return
    node.style.transitionProperty = 'transform'
    node.style.transitionDuration = `${DURATION.fast}ms`
    node.style.transitionTimingFunction = CSS_EASING.standard
    node.style.transform = `translate3d(0, -${lift}px, 0) scale(${scale})`
  }

  const leave = (): void => {
    node.style.transform = ''
  }

  node.addEventListener('pointerenter', enter)
  node.addEventListener('pointerleave', leave)

  return {
    update(next: HoverLiftParams) {
      lift = next.lift ?? 2
      scale = next.scale ?? 1
      disabled = next.disabled ?? false
      if (disabled) leave()
    },
    destroy() {
      node.removeEventListener('pointerenter', enter)
      node.removeEventListener('pointerleave', leave)
    }
  }
}

export interface SlidingIndicatorParams {
  /** CSS selector for the currently active item inside the container. */
  active?: string
  /** Which edge the bar sits on. */
  axis?: 'horizontal' | 'vertical'
  /** Re-run the measurement when this value changes (pass your tab state). */
  key?: unknown
}

/**
 * Slides a single bar under whichever item is currently active, instead of
 * flicking a border on and off. Put a `.motion-indicator` element inside the
 * container and mark the active item however you already do:
 *
 * ```svelte
 * <div class="tab-bar" use:slidingIndicator={{ active: '.tab-btn.active', key: activeTab }}>
 *   <button class="tab-btn" class:active={…}>…</button>
 *   <span class="motion-indicator"></span>
 * </div>
 * ```
 *
 * The container needs `position: relative`; `motion.css` styles the bar itself.
 */
export function slidingIndicator(
  node: HTMLElement,
  params: SlidingIndicatorParams = {}
): { update: (p: SlidingIndicatorParams) => void; destroy: () => void } {
  let active = params.active ?? '[aria-selected="true"], .active'
  let axis = params.axis ?? 'horizontal'
  let measured = false

  const position = (): void => {
    const bar = node.querySelector<HTMLElement>('.motion-indicator')
    const target = node.querySelector<HTMLElement>(active)
    if (!bar) return

    if (!target) {
      bar.style.opacity = '0'
      return
    }

    // First placement jumps into position; later ones glide.
    bar.style.transitionDuration = measured ? `${DURATION.base}ms` : '0ms'
    bar.style.transitionTimingFunction = CSS_EASING.standard
    bar.style.opacity = '1'

    if (axis === 'horizontal') {
      bar.style.width = `${target.offsetWidth}px`
      bar.style.transform = `translate3d(${target.offsetLeft}px, 0, 0)`
    } else {
      bar.style.height = `${target.offsetHeight}px`
      bar.style.transform = `translate3d(0, ${target.offsetTop}px, 0)`
    }

    measured = true
  }

  // Wait a frame so layout has settled before the first measurement.
  requestAnimationFrame(position)

  const resizeObserver = new ResizeObserver(position)
  resizeObserver.observe(node)

  return {
    update(next: SlidingIndicatorParams) {
      active = next.active ?? '[aria-selected="true"], .active'
      axis = next.axis ?? 'horizontal'
      // `key` is only here to make Svelte re-run this on a tab change.
      void next.key
      requestAnimationFrame(position)
    },
    destroy() {
      resizeObserver.disconnect()
    }
  }
}

export interface AutoHeightParams {
  /** Turn the morph off without removing the action. */
  disabled?: boolean
  /** Duration override in ms. */
  duration?: number
}

/**
 * Smoothly morphs a container's height when its contents change size — a modal
 * moving between steps, a panel revealing a section.
 *
 * The container must have exactly one element child, which is what gets
 * measured. `overflow: hidden` is applied *only* while the height is in motion
 * and cleared as soon as it settles, so popovers and dropdowns inside the
 * container are never clipped at rest.
 */
export function autoHeight(
  node: HTMLElement,
  params: AutoHeightParams = {}
): { update: (p: AutoHeightParams) => void; destroy: () => void } {
  let disabled = params.disabled ?? false
  let duration = params.duration ?? DURATION.slow
  let current: number | null = null
  let settleTimer: ReturnType<typeof setTimeout> | undefined

  const content = node.firstElementChild as HTMLElement | null
  if (!content) {
    return { update: () => {}, destroy: () => {} }
  }

  const settle = (): void => {
    // Back to `auto` so the container keeps tracking its content on its own.
    node.style.height = 'auto'
    node.style.overflow = ''
    node.style.transition = ''
  }

  const apply = (next: number): void => {
    if (disabled || prefersReducedMotion()) {
      current = next
      return
    }

    clearTimeout(settleTimer)

    // Pin the height we're leaving before animating to the new one.
    node.style.overflow = 'hidden'
    node.style.transition = 'none'
    node.style.height = `${current ?? next}px`
    void node.offsetHeight // force the pinned height to take effect

    node.style.transition = `height ${duration}ms ${CSS_EASING.standard}`
    node.style.height = `${next}px`

    current = next
    settleTimer = setTimeout(settle, duration)
  }

  const observer = new ResizeObserver((entries) => {
    const next = entries[0]?.contentRect.height
    if (next == null) return
    const rounded = Math.round(next)
    if (current === null) {
      current = rounded // first measurement: adopt it without animating
      return
    }
    if (rounded === current) return
    apply(rounded)
  })

  observer.observe(content)

  return {
    update(next: AutoHeightParams) {
      disabled = next.disabled ?? false
      duration = next.duration ?? DURATION.slow
      if (disabled) settle()
    },
    destroy() {
      clearTimeout(settleTimer)
      observer.disconnect()
    }
  }
}
