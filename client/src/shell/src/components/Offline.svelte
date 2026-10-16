<script lang="ts">
  import type { TabState } from '../../../common/shell'

  interface Props {
    tab: TabState
  }

  let { tab }: Props = $props()
</script>

<div class="screen">
  <section class="card">
    <h1>Can’t reach {tab.name}</h1>
    <p>
      {tab.origin} didn’t load. Check your connection, or ask the server’s admin whether it’s up.
    </p>
    {#if tab.error}
      <p class="detail">{tab.error}</p>
    {/if}
    <div class="actions">
      <button class="primary" onclick={() => window.shell.reloadTab(tab.id)}>Try again</button>
    </div>
  </section>
</div>

<style>
  .detail {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
  }
</style>
