<script lang="ts">
  import type { Channel } from '$src/interfaces/Channel'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import ChannelSidebarVoiceTab from './ChannelSidebarVoiceTab.svelte'
  import ChannelSidebarFilesTab from './ChannelSidebarFilesTab.svelte'

  let {
    channel,
    isOpen = $bindable(false)
  }: {
    channel: Channel | null
    isOpen: boolean
  } = $props()

  import { pressable, slidingIndicator, viewIn, viewOut } from '$src/animations'

  let activeTab = $state<'voice' | 'files'>('voice')
  let fileCount = $state(0)
</script>

<aside class="pane sidebar" class:closed={!isOpen || !channel}>
  <div class="tab-bar" use:slidingIndicator={{ active: '.tab-btn.active', key: activeTab }}>
    <button
      class="tab-btn"
      class:active={activeTab === 'voice'}
      onclick={() => (activeTab = 'voice')}
    >
      <Icon name="mic" size={11} strokeWidth={2.2} />
      Voice
    </button>
    <button
      class="tab-btn"
      class:active={activeTab === 'files'}
      onclick={() => (activeTab = 'files')}
    >
      <Icon name="file" size={11} strokeWidth={2.2} />
      Files
      {#if fileCount > 0}
        <span class="tab-badge">{fileCount}</span>
      {/if}
    </button>
    <button
      class="close-btn"
      onclick={() => (isOpen = false)}
      aria-label="Close sidebar"
      use:pressable={{ scale: 0.85 }}
    >
      <Icon name="x" size={12} strokeWidth={1.8} />
    </button>
    <span class="motion-indicator"></span>
  </div>

  <div class="sidebar-scroll">
    {#key activeTab}
      <div class="tab-panel" in:viewIn out:viewOut>
        {#if activeTab === 'voice'}
          <ChannelSidebarVoiceTab {channel} />
        {:else}
          <ChannelSidebarFilesTab {channel} bind:fileCount />
        {/if}
      </div>
    {/key}
  </div>
</aside>

<style>
  .sidebar {
    width: 220px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition:
      width 0.25s ease,
      opacity 0.25s ease;
    opacity: 1;
  }

  .sidebar.closed {
    width: 0;
    opacity: 0;
  }

  .tab-bar {
    position: relative;
    display: flex;
    border-bottom: 1px solid rgba(0, 0, 0, 0.07);
    background: white;
    flex-shrink: 0;
    color: #555;
  }

  .tab-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .tab-panel:not(:only-child) {
    position: absolute;
    inset: 0;
  }

  .tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 8px 0;
    border: none;
    background: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #bbb;
    transition: color var(--motion-fast) var(--ease-standard);
  }

  .tab-btn.active {
    color: #555;
  }

  .tab-btn:hover:not(.active) {
    color: #888;
  }

  .tab-badge {
    font-size: 10px;
    font-weight: 700;
    color: #ff843c;
    background: rgba(255, 132, 60, 0.12);
    border-radius: 999px;
    padding: 1px 6px;
    line-height: 1.4;
  }

  .close-btn {
    flex-shrink: 0;
    width: 32px;
    border: none;
    background: none;
    cursor: pointer;
    color: #bbb;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.12s;
    padding: 0;
    margin-right: 6px;
  }

  .close-btn:hover {
    color: #666;
  }

  .sidebar-scroll {
    position: relative;
    flex: 1;
    overflow-y: auto;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .sidebar-scroll::-webkit-scrollbar {
    width: 3px;
  }

  .sidebar-scroll::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }
</style>
