<!-- MarginSwitcher.svelte -->
<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte.js'
  import type { Margin } from '$src/interfaces/Margin'
  import CreateMarginModal from '$src/components/content/manage/margin/modals/CreateMarginModal.svelte'

  let open = $state(false)
  let createMarginOpen = $state(false)

  function selectMargin(margin: Margin): void {
    chatState.selectMargin(margin)
    open = false
  }
</script>

<div class="switcher-wrapper">
  <button class="switcher-btn" onclick={() => (open = !open)}>
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
    Switch margin
    <svg
      class="chevron"
      class:rotated={open}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  </button>

  {#if open}
    <div class="dropdown">
      {#each chatState.margins as margin (margin.marginId)}
        <button
          class="margin-item"
          class:active={chatState.selectedMargin?.marginId === margin.marginId}
          onclick={() => selectMargin(margin)}
        >
          <span class="margin-avatar">{margin.marginName[0].toUpperCase()}</span>
          <span class="margin-name">{margin.marginName}</span>
          {#if chatState.selectedMargin?.marginId === margin.marginId}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          {/if}
        </button>
      {/each}
      <button class="margin-item" onclick={() => (createMarginOpen = true)}
        >Create new margin</button
      >
    </div>
  {/if}
  <CreateMarginModal open={createMarginOpen} onClose={() => (createMarginOpen = false)} />
</div>

<style>
  .switcher-wrapper {
    position: relative;
  }

  .switcher-btn {
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
    transition:
      background 0.12s,
      color 0.12s;
  }

  .switcher-btn:hover {
    background: rgba(0, 0, 0, 0.04);
    color: #2a2a2a;
  }

  .chevron {
    margin-left: auto;
    transition: transform 0.15s;
  }

  .chevron.rotated {
    transform: rotate(90deg);
  }

  .dropdown {
    position: absolute;
    left: 100%;
    top: 0;
    margin-left: 8px;
    min-width: 200px;
    background: #fff;
    border: 1px solid #ece8e0;
    border-radius: 14px;
    padding: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    z-index: 100;
  }

  .margin-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: none;
    border: none;
    border-radius: 9px;
    font-size: 13px;
    font-weight: 500;
    color: #444;
    cursor: pointer;
    text-align: left;
    transition: background 0.1s;
  }

  .margin-item:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  .margin-item.active {
    color: #f47e3a;
  }

  .margin-avatar {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    background: rgba(228, 113, 42, 0.12);
    color: #f47e3a;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .margin-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
