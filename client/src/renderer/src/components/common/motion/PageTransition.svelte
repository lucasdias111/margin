<script lang="ts">
  /**
   * Wraps a route's contents so navigating between pages fades and settles
   * instead of cutting. Drop it around the root element of a `routes/*` page:
   *
   * ```svelte
   * <PageTransition>
   *   <div class="container">…</div>
   * </PageTransition>
   * ```
   *
   * `svelte-spa-router` swaps the whole component on navigation, so only the
   * entrance plays — which is what we want here: the new page should arrive
   * promptly rather than wait for the old one to finish leaving.
   */
  import type { Snippet } from 'svelte'
  import { DURATION, riseIn } from '$src/animations'

  interface Props {
    children: Snippet
    /** Travel distance for the rise, in px. */
    distance?: number
    /** Hold before the page appears, in ms. */
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
