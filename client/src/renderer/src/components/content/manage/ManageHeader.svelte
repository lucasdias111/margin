<script lang="ts">
  import { navigationService } from '$src/services/NavigationService'
  import { View } from '$src/interfaces/View'
  import type { ManageTab } from '$src/states/NavigationState.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'

  interface Props {
    activeTab: ManageTab
    onTabChange: (tab: ManageTab) => void
  }

  let { activeTab, onTabChange }: Props = $props()

  const tabs: ManageTab[] = ['Margin', 'Spaces']
</script>

<div class="manage-header">
  <div
    class="back-btn"
    onclick={() => navigationService.setView(View.Margin)}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
      }
    }}
    role="button"
    tabindex="0"
    title="Back"
    aria-label="Back to list"
  >
    <Icon name="chevronLeft" size={22} color="#1a1a1a" strokeWidth={2.5} />
  </div>
  <h1>Manage</h1>
  <nav class="tabs" data-tour="manage-tabs">
    {#each tabs as tab}
      <button class="tab-btn" class:active={activeTab === tab} onclick={() => onTabChange(tab)}>
        {tab}
      </button>
    {/each}
  </nav>
</div>

<style>
  .manage-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: #ffffff;
    height: 64px;
    border-bottom: 1px solid #d9d9d9;
    padding: 0 24px;
    flex-shrink: 0;
  }

  .back-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: #2d2d2d;
    padding: 0;
    line-height: 1;
  }

  h1 {
    font-size: 1.4rem;
    color: #2d2d2d;
    margin: 0;
    font-weight: 600;
    white-space: nowrap;
  }

  .tabs {
    display: flex;
    gap: 2rem;
    margin-left: auto;
  }

  .tab-btn {
    background: none;
    border: none;
    font-size: 0.95rem;
    color: #888;
    cursor: pointer;
    padding: 0;
    font-weight: 500;
  }

  .tab-btn.active {
    color: #ff843c;
    font-weight: 600;
  }

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: #555;
    margin-right: 2px;
    flex-shrink: 0;
  }

  .back-btn:hover {
    background: #f6f3ee;
    color: #1a1a1a;
  }

  .back-btn :global(svg) {
    display: block;
  }
</style>
