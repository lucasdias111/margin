<script lang="ts">
  /**
   * Message-shaped placeholders shown while a conversation loads.
   *
   * A shaped skeleton beats a spinner here: the pane keeps the silhouette of a
   * conversation, so the switch reads as "this is filling in" rather than
   * "everything vanished". The widths are fixed rather than random so the
   * placeholder doesn't reshuffle on every re-render.
   */
  import { riseIn } from '$src/animations'

  interface Props {
    /** How many placeholder rows to draw. */
    rows?: number
  }

  let { rows = 7 }: Props = $props()

  /** Repeating widths + sides, so the stack looks like a real back-and-forth. */
  const SHAPES = [
    { width: 62, sent: false },
    { width: 40, sent: false },
    { width: 54, sent: true },
    { width: 71, sent: false },
    { width: 35, sent: true },
    { width: 58, sent: true },
    { width: 46, sent: false }
  ]
</script>

<div class="skeleton" aria-hidden="true">
  {#each Array.from({ length: rows }, (_, i) => i) as i (i)}
    {@const shape = SHAPES[i % SHAPES.length]}
    <div
      class="row"
      class:sent={shape.sent}
      in:riseIn={{ distance: 8, index: i, stagger: 45, duration: 'base' }}
    >
      {#if !shape.sent}
        <div class="motion-skeleton avatar"></div>
      {/if}
      <div class="motion-skeleton bubble" style="width: {shape.width}%"></div>
    </div>
  {/each}
</div>

<style>
  .skeleton {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: flex-end;
    gap: 14px;
    padding: 20px 24px;
    min-height: 0;
  }

  .row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }

  .row.sent {
    justify-content: flex-end;
  }

  .avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .bubble {
    height: 34px;
    border-radius: 14px;
    max-width: 60%;
  }

  .row.sent .bubble {
    border-radius: 14px;
  }
</style>
