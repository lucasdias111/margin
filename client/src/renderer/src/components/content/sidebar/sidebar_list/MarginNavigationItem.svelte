<script lang="ts">
  import type { Snippet } from 'svelte'
  interface Props {
    label: string
    active?: boolean
    onclick: () => void
    icon?: Snippet
  }

  let { label, active = false, onclick, icon }: Props = $props()
</script>

<button class="nav-item" class:active {onclick}>
  {@render icon?.()}
  {label}
</button>

<style>
  .nav-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: none;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 550;
    color: #888;
    cursor: pointer;
    text-align: left;
    transition: background 0.12s, color 0.12s;
  }

  .nav-item:hover:not(.active) {
    background: rgba(0, 0, 0, 0.04);
    color: #2a2a2a;
  }

  .nav-item.active {
    background: rgba(228, 113, 42, 0.1);
    color: #f47e3a;
  }

  .nav-item :global(svg) {
    flex-shrink: 0;
    opacity: 0.6;
  }

  .nav-item.active :global(svg) {
    opacity: 1;
  }
</style>
