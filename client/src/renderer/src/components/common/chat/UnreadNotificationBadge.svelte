<script lang="ts">
  let {
    shouldShow,
    count,
    variant = 'overlay'
  }: { shouldShow: boolean; count: number; variant?: 'overlay' | 'inline' } = $props()
</script>

{#if shouldShow}
  <span class="badge {variant}">{count > 99 ? '99+' : count}</span>
{/if}

<style>
  .badge {
    background-color: #ff843c;
    color: white;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    line-height: 1.4;
    min-width: 18px;
    text-align: center;
    pointer-events: none;
  }

  .overlay {
    position: absolute;
    top: -6px;
    right: -8px;
    padding: 2px 6px;
    box-shadow: 0 0 0 2px #2d2d2d;
  }

  .inline {
    position: static;
    padding: 2px 7px;
    flex-shrink: 0;
  }
</style>
