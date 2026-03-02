<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte'
  import type { Space } from '$src/interfaces/Space'
  import { onDestroy, onMount } from 'svelte'
  import { spacesService } from '$src/services/SpacesService'
  import ChannelEntry from '$src/components/sidebar/sidebar_list/ChannelEntry.svelte'
  import { notificationState } from '$src/states/NotificationState.svelte'
  import UnreadNotificationBadge from '$src/components/common/chat/UnreadNotificationBadge.svelte'

  let spaces = $state<Space[]>([])
  let expandedSpaceId = $state<number | null>(null)

  let selectedChannelId = $derived(chatState.selectedChannel?.id)

  onMount(async () => {
    spaces = await spacesService.getAllSpacesForUser()
  })

  onDestroy(() => {
    chatState.selectSpace(null)
    chatState.selectChannel(null)
  })

  async function toggleSpace(space: Space): Promise<void> {
    chatState.selectSpace(space)
    expandedSpaceId = expandedSpaceId === space.spaceId ? null : space.spaceId
  }

  const SPACE_COLORS = [
    { bg: '#FFF0E6', dot: '#E8712A', text: '#C45A18' },
    { bg: '#E8F4F8', dot: '#4A9EBF', text: '#2E7A96' },
    { bg: '#EEF6EE', dot: '#5BAD6F', text: '#3D8A52' },
    { bg: '#F3EEF8', dot: '#9B72CF', text: '#7850AD' },
    { bg: '#FDF5E6', dot: '#C9A227', text: '#9E7D10' }
  ]

  function spaceColor(spaceId: number) {
    return SPACE_COLORS[spaceId % SPACE_COLORS.length]
  }

  function spaceInitials(name: string): string {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('')
  }
</script>

<div class="spaces-list">
  <div class="spaces-header">
    <span class="header-label">Spaces</span>
    <span class="header-count">{spaces.length}</span>
  </div>

  <div class="spaces-stack">
    {#each spaces as space (space.spaceId)}
      {@const color = spaceColor(space.spaceId)}
      {@const isOpen = expandedSpaceId === space.spaceId}
      {@const unreadCount = notificationState.getTotalUnreadMessagesForSpace(space).length}

      <div
        class="space-card"
        class:is-open={isOpen}
        style="--dot: {color.dot}; --card-bg: {color.bg}; --text: {color.text};"
      >
        <button class="space-row" onclick={() => toggleSpace(space)} aria-expanded={isOpen}>
          <span class="space-avatar" style="background: {color.bg}; color: {color.text};">
            {spaceInitials(space.spaceName)}
          </span>

          <span class="space-info">
            <span class="space-name">{space.spaceName}</span>
            <span class="space-meta">{space.channels?.length ?? 0} channels</span>
          </span>

          {#if !isOpen}
            <UnreadNotificationBadge
              shouldShow={unreadCount > 0}
              count={unreadCount}
              variant="inline"
            />
          {/if}

          <span class="chevron" class:rotated={isOpen}>
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="2,3.5 5,6.5 8,3.5" />
            </svg>
          </span>
        </button>

        {#if isOpen}
          <div class="channels-zone">
            <div class="channels-divider"></div>
            <ul class="channels">
              {#each space.channels as channel (channel.id)}
                <ChannelEntry {channel} active={selectedChannelId === channel.id} />
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .spaces-list {
    padding: 10px 0 20px;
  }

  .spaces-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 18px 10px;
  }

  .header-label {
    font-size: 14px;
    color: #2d2d2d;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  .header-count {
    font-size: 10px;
    font-weight: 600;
    color: #2d2d2d;
    background: #f2f2f2;
    border-radius: 20px;
    padding: 1px 6px;
    line-height: 1.5;
  }

  .spaces-stack {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 0 10px;
  }

  .space-card {
    border-radius: 12px;
    border: 1px solid transparent;
    background: #fafafa;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
    overflow: hidden;
  }

  .space-card:hover {
    border-color: #ebebeb;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }

  .space-card.is-open {
    border-color: var(--dot);
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  }

  .space-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px 9px 10px;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
  }

  .space-avatar {
    position: relative;
    flex-shrink: 0;
    width: 34px;
    height: 34px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
  }

  .space-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .space-name {
    font-size: 14px;
    font-weight: 550;
    color: #2a2a2a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
  }

  .space-meta {
    font-size: 12px;
    font-weight: 400;
    line-height: 1.2;
  }

  .chevron {
    flex-shrink: 0;
    color: #ccc;
    display: flex;
    align-items: center;
    transition:
      transform 0.2s ease,
      color 0.15s;
  }

  .chevron.rotated {
    transform: rotate(180deg);
    color: var(--dot);
  }

  .channels-zone {
    background: rgba(0, 0, 0, 0.025);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    padding-bottom: 8px;
  }

  .channels {
    position: relative;
    padding: 10px 10px 0 25px;
    display: flex;
    flex-direction: column;
    gap: 1px;
    margin: 0;
  }
</style>
