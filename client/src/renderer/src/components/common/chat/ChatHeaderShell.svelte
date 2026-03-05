<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    isLoading?: boolean
    onToggleSidebar?(): void
    sidebarOpen?: boolean
    left: Snippet
    right?: Snippet
  }

  let {
    isLoading = false,
    onToggleSidebar,
    sidebarOpen = true,
    left,
    right
  }: Props = $props()
</script>

<div class="chat-header">
  <div class="header-left">
    {#if isLoading}
      <div class="skeleton avatar"></div>
      <div class="skeleton-info">
        <div class="skeleton name"></div>
        <div class="skeleton status"></div>
      </div>
    {:else}
      {@render left()}
    {/if}
  </div>

  <div class="header-right">
    {#if !isLoading && right}
      {@render right()}
    {/if}

    {#if onToggleSidebar}
      <button
        class="icon-btn"
        class:active={sidebarOpen}
        onclick={onToggleSidebar}
        title="Toggle member list"
        aria-label="Toggle sidebar"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
      </button>
    {/if}
  </div>
</div>

<style>
  .chat-header {
    height: 80px;
    background-color: #f8ebd2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    border-bottom: none;
    border-radius: 15px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: #aaa;
    transition:
      background 0.15s ease,
      color 0.15s ease;
  }

  .icon-btn:hover {
    background: #f6f3ee;
    color: #555;
  }

  .icon-btn.active {
    background: #f0ebe1;
    color: #e07a30;
  }

  .skeleton-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .skeleton {
    background: linear-gradient(90deg, #f0ece6 25%, #e8e4de 50%, #f0ece6 75%);
    background-size: 200% 100%;
    animation: shimmer 1.2s ease-in-out infinite;
    border-radius: 6px;
  }

  .skeleton.avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .skeleton.name {
    width: 110px;
    height: 13px;
  }

  .skeleton.status {
    width: 48px;
    height: 10px;
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
</style>
