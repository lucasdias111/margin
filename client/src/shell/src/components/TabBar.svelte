<script lang="ts">
  import { TAB_BAR_HEIGHT, type ShellState } from '../../../common/shell'

  interface Props {
    snapshot: ShellState
    onAdd: () => void
    onSettings: () => void
    onSelect: (id: string) => void
  }

  let { snapshot, onAdd, onSettings, onSelect }: Props = $props()

  const isMac = $derived(snapshot.platform === 'darwin')
  const update = $derived(snapshot.update)

  function unreadLabel(count: number): string {
    return count > 99 ? '99+' : String(count)
  }
</script>

<header class="bar" class:mac={isMac} style:height="{TAB_BAR_HEIGHT}px">
  <nav class="tabs" aria-label="Servers">
    {#each snapshot.tabs as tab (tab.id)}
      <button
        class="tab"
        class:active={tab.id === snapshot.activeId}
        title={tab.origin}
        aria-current={tab.id === snapshot.activeId ? 'page' : undefined}
        onclick={() => onSelect(tab.id)}
      >
        {#if tab.status === 'failed'}
          <span class="dot failed" aria-label="Offline"></span>
        {:else if tab.status === 'loading'}
          <span class="dot loading" aria-label="Loading"></span>
        {/if}
        <span class="name">{tab.name}</span>
        {#if tab.unread > 0}
          <span class="badge" aria-label="{tab.unread} unread">{unreadLabel(tab.unread)}</span>
        {/if}
      </button>
    {/each}
    <button class="icon" title="Add a server" aria-label="Add a server" onclick={onAdd}>
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </button>
  </nav>

  <div class="drag"></div>

  {#if update.kind === 'available'}
    <div class="update">
      <button class="pill" onclick={() => window.shell.acceptUpdate()}>
        {update.canInstall ? `Update to ${update.version}` : `Download ${update.version}`}
      </button>
      <button
        class="icon small"
        aria-label="Dismiss update"
        onclick={() => window.shell.dismissUpdate()}
      >
        <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" />
        </svg>
      </button>
    </div>
  {:else if update.kind === 'downloading'}
    <span class="pill quiet">Downloading {Math.round(update.percent)}%</span>
  {:else if update.kind === 'ready'}
    <button class="pill" onclick={() => window.shell.installUpdate()}>Restart to update</button>
  {/if}

  <button class="icon" title="Settings" aria-label="Settings" onclick={onSettings}>
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <circle cx="8" cy="8" r="2.2" fill="none" stroke="currentColor" stroke-width="1.3" />
      <path
        d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"
        stroke="currentColor"
        stroke-width="1.3"
        stroke-linecap="round"
      />
    </svg>
  </button>

  {#if !isMac}
    <div class="controls">
      <button aria-label="Minimize" onclick={() => window.shell.minimize()}>
        <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
          <path d="M0 5h10" stroke="currentColor" />
        </svg>
      </button>
      <button
        aria-label={snapshot.maximized ? 'Restore' : 'Maximize'}
        onclick={() => window.shell.toggleMaximize()}
      >
        <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
          {#if snapshot.maximized}
            <path d="M2 0.5h7.5V8M0.5 2.5h7v7h-7z" fill="none" stroke="currentColor" />
          {:else}
            <rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" />
          {/if}
        </svg>
      </button>
      <button class="close" aria-label="Close" onclick={() => window.shell.close()}>
        <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
          <path d="M0 0l10 10M10 0L0 10" stroke="currentColor" />
        </svg>
      </button>
    </div>
  {/if}
</header>

<style>
  .bar {
    display: flex;
    align-items: stretch;
    background: var(--bar);
    border-bottom: 1px solid var(--border);
    box-sizing: border-box;
    -webkit-app-region: drag;
    padding-left: 8px;
    flex-shrink: 0;
  }

  /* Room for the traffic lights. */
  .bar.mac {
    padding-left: 80px;
  }

  .tabs {
    display: flex;
    align-items: center;
    gap: 2px;
    min-width: 0;
    overflow: hidden;
  }

  .drag {
    flex: 1;
  }

  button {
    -webkit-app-region: no-drag;
    border: none;
    background: none;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    max-width: 200px;
    padding: 0 10px;
    border-radius: 7px;
    color: var(--muted);
  }

  .tab:hover {
    background: var(--hover);
  }

  .tab.active {
    background: var(--tab-active);
    color: var(--text);
    box-shadow: 0 0 0 1px var(--border);
  }

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .badge {
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    box-sizing: border-box;
    border-radius: 8px;
    background: var(--badge);
    color: #fff;
    font-size: 10px;
    font-weight: 600;
    line-height: 16px;
    text-align: center;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .dot.failed {
    background: var(--danger);
  }

  .dot.loading {
    background: var(--muted);
    animation: pulse 1s ease-in-out infinite alternate;
  }

  @keyframes pulse {
    to {
      opacity: 0.25;
    }
  }

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    margin: auto 2px;
    border-radius: 7px;
    color: var(--muted);
  }

  .icon.small {
    width: 20px;
    height: 20px;
  }

  .icon:hover {
    background: var(--hover);
    color: var(--text);
  }

  .update {
    display: flex;
    align-items: center;
  }

  .pill {
    margin: auto 4px;
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--accent);
    color: var(--accent-text);
    font-size: 12px;
    font-weight: 500;
  }

  .pill.quiet {
    background: var(--hover);
    color: var(--muted);
  }

  .controls {
    display: flex;
    margin-left: 6px;
  }

  .controls button {
    width: 46px;
    color: var(--text);
  }

  .controls button:hover {
    background: var(--hover);
  }

  .controls .close:hover {
    background: #c42b1c;
    color: #fff;
  }
</style>
