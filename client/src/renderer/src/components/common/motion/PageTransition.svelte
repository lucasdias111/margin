<script lang="ts">
  import type { Snippet } from 'svelte'
  import { DURATION, riseIn } from '$src/animations'

  interface Props {
    children: Snippet
    distance?: number
    delay?: number
  }

  let { children, distance = 14, delay = 0 }: Props = $props()
</script>

<div class="page" in:riseIn={{ distance, delay, duration: DURATION.slower }}>
  {@render children()}
</div>

<style>
  .page {
    display: flex;
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
</style>
