<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    text: string
    open?: boolean
    position?: 'top' | 'bottom' | 'left' | 'right'
    children?: Snippet
  }

  let { text, open, position = 'top', children }: Props = $props()

  let tipEl = $state<HTMLElement | null>(null)

  function adjust(): void {
    if (!tipEl || !text) return
    tipEl.style.removeProperty('--ax')
    tipEl.style.removeProperty('--ay')
    requestAnimationFrame(() => {
      if (!tipEl) return
      const r = tipEl.getBoundingClientRect()
      const pad = 8
      let dx = 0
      let dy = 0
      if (r.left < pad) dx = pad - r.left
      else if (r.right > window.innerWidth - pad) dx = window.innerWidth - pad - r.right
      if (r.top < pad) dy = pad - r.top
      else if (r.bottom > window.innerHeight - pad) dy = window.innerHeight - pad - r.bottom
      if (dx) tipEl.style.setProperty('--ax', `${dx}px`)
      if (dy) tipEl.style.setProperty('--ay', `${dy}px`)
    })
  }
</script>

{#if children}
  <div class="tooltip-wrapper" onmouseenter={adjust}>
    {@render children()}
    <div class="tip {position}" role="tooltip" bind:this={tipEl}>{text}</div>
  </div>
{:else if open}
  <div class="tooltip">{text}</div>
{/if}

<style>
  .tooltip-wrapper {
    position: relative;
    display: inline-flex;
  }

  .tip {
    position: absolute;
    background: #2d2d2d;
    color: #fff;
    font-size: 11px;
    font-weight: 500;
    line-height: 1.4;
    padding: 5px 9px;
    border-radius: 6px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease;
    z-index: 200;
  }

  .tooltip-wrapper:hover .tip:not(:empty) {
    opacity: 1;
  }

  .tip.top {
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(calc(-50% + var(--ax, 0px)));
  }

  .tip.bottom {
    top: calc(100% + 6px);
    left: 50%;
    transform: translateX(calc(-50% + var(--ax, 0px)));
  }

  .tip.left {
    right: calc(100% + 6px);
    top: 50%;
    transform: translateY(calc(-50% + var(--ay, 0px)));
  }

  .tip.right {
    left: calc(100% + 6px);
    top: 50%;
    transform: translateY(calc(-50% + var(--ay, 0px)));
  }

  .tooltip {
    position: absolute;
    left: calc(100% + 10px);
    top: 50%;
    transform: translateY(-50%);
    width: 180px;
    background: #ffffff;
    border: 1px solid #ece8e0;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 12px;
    color: #555250;
    line-height: 1.5;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    z-index: 10;
    pointer-events: none;
  }

  .tooltip::before {
    content: '';
    position: absolute;
    top: 50%;
    right: 100%;
    transform: translateY(-50%);
    border: 6px solid transparent;
    border-right-color: #ece8e0;
  }

  .tooltip::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 100%;
    transform: translateY(-50%);
    margin-right: -1px;
    border: 5px solid transparent;
    border-right-color: #ffffff;
  }
</style>
