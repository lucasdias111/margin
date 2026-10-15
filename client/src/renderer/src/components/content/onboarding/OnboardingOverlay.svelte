<script lang="ts">
  import { onboardingState } from '$src/states/OnboardingState.svelte'
  import { flows, type Placement } from './flows'
  import Button from '$src/components/common/buttons/Button.svelte'

  const GAP = 16
  const EDGE = 8

  let rect = $state<DOMRect | null>(null)
  let tooltipEl = $state<HTMLElement | null>(null)
  let tooltipSize = $state<{ width: number; height: number }>({ width: 0, height: 0 })

  const activeFlow = $derived(flows.find((f) => f.id === onboardingState.activeFlow))
  const current = $derived(activeFlow?.steps[onboardingState.step])
  const isLast = $derived(activeFlow ? onboardingState.step === activeFlow.steps.length - 1 : false)

  function effectivePlacement(p: Placement): Placement {
    if (typeof window === 'undefined') return p
    if (window.innerWidth <= 768 && (p === 'right' || p === 'left')) return 'top'
    return p
  }

  $effect(() => {
    if (onboardingState.skippedAll) return
    if (onboardingState.activeFlow) return
    for (const flow of flows) {
      if (onboardingState.isCompleted(flow.id)) continue
      if (!flow.trigger()) continue
      onboardingState.startFlow(flow.id)
      return
    }
  })

  $effect(() => {
    if (!onboardingState.activeFlow || !current) {
      rect = null
      return undefined
    }

    let scrolled = false

    const sync = (): void => {
      const el = document.querySelector(current.target)
      if (!el) {
        rect = null
        return
      }
      if (!scrolled) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        scrolled = true
      }
      rect = el.getBoundingClientRect()
    }

    sync()
    const mo = new MutationObserver(sync)
    mo.observe(document.body, { childList: true, subtree: true, attributes: true })
    window.addEventListener('resize', sync)
    window.addEventListener('scroll', sync, true)

    return () => {
      mo.disconnect()
      window.removeEventListener('resize', sync)
      window.removeEventListener('scroll', sync, true)
    }
  })

  $effect(() => {
    if (!tooltipEl) return undefined
    const measure = (): void => {
      if (!tooltipEl) return
      const r = tooltipEl.getBoundingClientRect()
      if (r.width !== tooltipSize.width || r.height !== tooltipSize.height) {
        tooltipSize = { width: r.width, height: r.height }
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(tooltipEl)
    return () => ro.disconnect()
  })

  const position = $derived.by(() => {
    if (!rect || !current || tooltipSize.width === 0) {
      return { top: 0, left: 0, ready: false }
    }
    const placement = effectivePlacement(current.placement)
    let top = 0
    let left = 0
    switch (placement) {
      case 'right':
        left = rect.right + GAP
        top = rect.top + rect.height / 2 - tooltipSize.height / 2
        break
      case 'left':
        left = rect.left - GAP - tooltipSize.width
        top = rect.top + rect.height / 2 - tooltipSize.height / 2
        break
      case 'top':
        left = rect.left + rect.width / 2 - tooltipSize.width / 2
        top = rect.top - GAP - tooltipSize.height
        break
      case 'bottom':
        left = rect.left + rect.width / 2 - tooltipSize.width / 2
        top = rect.bottom + GAP
        break
    }
    if (typeof window !== 'undefined') {
      const maxLeft = window.innerWidth - tooltipSize.width - EDGE
      const maxTop = window.innerHeight - tooltipSize.height - EDGE
      left = Math.max(EDGE, Math.min(left, maxLeft))
      top = Math.max(EDGE, Math.min(top, maxTop))
    }
    return { top, left, ready: true }
  })

  function advance(): void {
    if (isLast) onboardingState.finishFlow()
    else onboardingState.next()
  }
</script>

{#if onboardingState.activeFlow && current && rect}
  <div class="backdrop"></div>
  <div
    class="cutout"
    style:top="{rect.top - 6}px"
    style:left="{rect.left - 6}px"
    style:width="{rect.width + 12}px"
    style:height="{rect.height + 12}px"
  ></div>
  <div
    class="tooltip"
    class:ready={position.ready}
    bind:this={tooltipEl}
    style:top="{position.top}px"
    style:left="{position.left}px"
  >
    <h3>{current.title}</h3>
    <p>{current.body}</p>
    <div class="footer">
      <span class="progress">
        {#if activeFlow && activeFlow.steps.length > 1}
          {onboardingState.step + 1} / {activeFlow.steps.length}
        {/if}
      </span>
      <div class="actions">
        <button class="skip-all" onclick={() => onboardingState.skipAll()}>Skip all</button>
        <button class="skip" onclick={() => onboardingState.finishFlow()}>Skip</button>
        <Button
          buttonType="primary"
          size="small"
          text={isLast ? 'Done' : 'Next'}
          onClick={advance}
        />
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.05);
    z-index: 9000;
    pointer-events: none;
  }

  .cutout {
    position: fixed;
    border-radius: 12px;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.55);
    pointer-events: none;
    z-index: 9001;
    transition:
      top 0.25s ease,
      left 0.25s ease,
      width 0.25s ease,
      height 0.25s ease;
  }

  .tooltip {
    position: fixed;
    z-index: 9002;
    background: #2a2a2a;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 12px;
    padding: 16px;
    max-width: 300px;
    color: #ddd;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    visibility: hidden;
    opacity: 0;
    transition:
      top 0.2s ease,
      left 0.2s ease,
      opacity 0.15s ease;
  }

  .tooltip.ready {
    visibility: visible;
    opacity: 1;
  }

  h3 {
    margin: 0 0 6px;
    font-size: 14px;
    color: #fff;
    font-weight: 600;
  }

  p {
    margin: 0 0 12px;
    font-size: 13px;
    line-height: 1.4;
    color: #bbb;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .progress {
    font-size: 11px;
    color: #888;
    letter-spacing: 0.04em;
    min-width: 0;
  }

  .actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .skip,
  .skip-all {
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    font-size: 12px;
    padding: 4px 8px;
  }

  .skip:hover,
  .skip-all:hover {
    color: #ff843c;
  }

  .skip-all {
    color: #666;
  }
</style>
