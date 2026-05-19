<script lang="ts">
  import type { Snippet } from 'svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'

  interface Props {
    isLoading?: boolean
    onToggleSidebar?(): void
    sidebarOpen?: boolean

    onBack?(): void
    left: Snippet
    right?: Snippet
  }

  let {
    isLoading = false,
    onToggleSidebar,
    sidebarOpen = true,
    onBack,
    left,
    right
  }: Props = $props()
</script>

<div class="pane chat-header">
  <div class="header-left">
    {#if onBack}
      <div
        class="back-btn"
        onclick={onBack}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onBack?.()
          }
        }}
        role="button"
        tabindex="0"
        title="Back"
        aria-label="Back to list"
      >
        <Icon name="chevronLeft" size={22} color="#1a1a1a" strokeWidth={2.5} />
      </div>
    {/if}
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
        <Icon name="sidebar" size={17} />
      </button>
    {/if}
  </div>
</div>

<style>
  .chat-header {
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    border-radius: 15px;
  }

  @media (max-width: 768px) {
    .chat-header {
      height: 56px;
      border-radius: 0;
      border: none;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }
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

  .back-btn {
    display: none;
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

  @media (max-width: 768px) {
    .back-btn {
      display: flex;
    }
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
    background: linear-gradient(90deg, #f5ede3 25%, #edddd0 50%, #f5ede3 75%);
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
