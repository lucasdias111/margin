<script lang="ts">
  import type { ShellState } from '../../../common/shell'

  interface Props {
    snapshot: ShellState
    onClose: () => void
  }

  let { snapshot, onClose }: Props = $props()

  let confirming = $state<string | null>(null)
  let removing = $state(false)

  async function remove(id: string): Promise<void> {
    removing = true
    await window.shell.removeServer(id)
    removing = false
    confirming = null
  }
</script>

<div class="screen">
  <section class="card">
    <h1>Servers</h1>
    <p>Removing a server signs you out of it on this computer.</p>

    {#if snapshot.tabs.length === 0}
      <p>No servers yet.</p>
    {:else}
      <ul>
        {#each snapshot.tabs as tab (tab.id)}
          <li>
            <div class="info">
              <span class="name">{tab.name}</span>
              <span class="origin">{tab.origin}</span>
            </div>
            {#if confirming === tab.id}
              <button class="secondary" disabled={removing} onclick={() => (confirming = null)}>
                Keep
              </button>
              <button class="danger" disabled={removing} onclick={() => remove(tab.id)}>
                Remove
              </button>
            {:else}
              <button class="secondary" onclick={() => (confirming = tab.id)}>Remove…</button>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}

    <div class="footer">
      <span class="version">margin desktop {snapshot.shellVersion}</span>
      <button class="primary" onclick={onClose}>Done</button>
    </div>
  </section>
</div>

<style>
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--border);
  }

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 0;
    border-bottom: 1px solid var(--border);
  }

  .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .name {
    font-weight: 500;
  }

  .origin {
    color: var(--muted);
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    user-select: text;
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 18px;
  }

  .version {
    color: var(--muted);
    font-size: 12px;
  }
</style>
