<script lang="ts">
  import ChatHeaderShell from '$src/components/common/chat/ChatHeaderShell.svelte'

  interface Props {
    name: string
    description?: string
    onToggleSidebar?(): void
    sidebarOpen?: boolean
    onBack?(): void
    isLoading?: boolean
  }

  let {
    name,
    description,
    onToggleSidebar,
    sidebarOpen = true,
    onBack,
    isLoading = false
  }: Props = $props()
</script>

<ChatHeaderShell {isLoading} {onToggleSidebar} {sidebarOpen} {onBack}>
  {#snippet left()}
    <div class="channel-info">
      <span class="channel-name">{name}</span>
      {#if description}
        <span class="channel-description">{description}</span>
      {/if}
    </div>
  {/snippet}
</ChatHeaderShell>

<style>
  .channel-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .channel-name {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1a1a1a;
    letter-spacing: -0.01em;
    line-height: 1;
  }

  .channel-description {
    font-size: 0.72rem;
    font-weight: 500;
    color: #aaa;
    letter-spacing: 0.01em;
    line-height: 1;
  }
</style>
