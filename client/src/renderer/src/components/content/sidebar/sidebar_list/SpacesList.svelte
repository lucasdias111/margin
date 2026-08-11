<script lang="ts">
  import { spaceState } from '$src/states/SpaceState.svelte.js'
  import type { Space } from '$src/interfaces/Space'
  import { spaceService } from '$src/services/SpaceService'
  import ChannelEntry from '$src/components/content/sidebar/sidebar_list/ChannelEntry.svelte'
  import { notificationService } from '$src/services/NotificationService'
  import UnreadNotificationBadge from '$src/components/common/chat/UnreadNotificationBadge.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { navigationState } from '$src/states/NavigationState.svelte'

  const spaces = $derived(spaceState.spaces)
  let selectedChannelId = $derived(navigationState.selectedChannel?.id)

  $effect(() => {
    const marginId = navigationState.selectedMargin?.marginId
    if (marginId) {
      spaceService.getAllSpacesForUser(marginId)
    }
  })

  $effect(() => {
    const channelId = navigationState.selectedChannel?.id
    if (!channelId) return
    for (const space of spaces) {
      if (space.channels.some((ch) => ch.id === channelId)) {
        spaceState.expand(space.spaceId)
        return
      }
    }
  })

  function toggleSpace(space: Space): void {
    spaceService.select(space)
    spaceState.toggleExpanded(space.spaceId)
  }

  function spaceInitials(name: string): string {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('')
  }
</script>

<div class="spaces-list" data-tour="margin-spaces">
  <div class="spaces-header">
    <span class="header-label">Spaces</span>
    <span class="header-count">{spaces.length}</span>
  </div>

  <div class="spaces-stack">
    {#each spaces as space (space.spaceId)}
      {@const isOpen = spaceState.isExpanded(space.spaceId)}
      {@const unreadCount = notificationService.totalUnreadMessagesForSpace(space)}

      <div class="space-group" class:is-open={isOpen}>
        <button class="space-row" onclick={() => toggleSpace(space)} aria-expanded={isOpen}>
          <span class="space-avatar">{spaceInitials(space.spaceName)}</span>

          <span class="space-info">
            <span class="space-name">{space.spaceName}</span>
            {#if space.spaceDescription}
              <span class="space-meta">{space.spaceDescription}</span>
            {/if}
          </span>

          {#if !isOpen}
            <UnreadNotificationBadge shouldShow={unreadCount > 0} count={1} variant="inline" />
          {/if}

          <span class="chevron" class:rotated={isOpen}>
            <Icon name="chevronDown" size={10} strokeWidth={1.8} />
          </span>
        </button>

        {#if isOpen}
          <ul class="channels">
            {#each space.channels as channel (channel.id)}
              <ChannelEntry {channel} active={selectedChannelId === channel.id} />
            {/each}
          </ul>
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
    padding: 8px 20px 6px;
  }

  .header-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #b0b0ae;
  }

  .header-count {
    font-size: 11px;
    font-weight: 600;
    color: #b0b0ae;
  }

  .spaces-stack {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0 10px;
  }

  .space-group {
    border-radius: 10px;
    transition: background 0.15s;
  }

  .space-group.is-open {
    background: rgba(0, 0, 0, 0.022);
    padding-bottom: 6px;
  }

  .space-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: none;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    text-align: left;
    transition: background 0.12s;
  }

  .space-row:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  .space-avatar {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #efeeec;
    color: #7a7a76;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
    transition:
      background 0.15s,
      color 0.15s;
  }

  .space-group.is-open .space-avatar {
    background: rgba(228, 113, 42, 0.12);
    color: #ff843c;
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
    color: #6a6a66;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
    transition: color 0.15s;
  }

  .space-row:hover .space-name,
  .space-group.is-open .space-name {
    color: #2a2a2a;
  }

  .space-meta {
    font-size: 12px;
    color: #b8b8b4;
    font-weight: 400;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chevron {
    flex-shrink: 0;
    color: #c4c4c0;
    display: flex;
    align-items: center;
    transition: transform 0.2s ease;
  }

  .chevron.rotated {
    transform: rotate(180deg);
  }

  .channels {
    position: relative;
    margin: 2px 0 0 23px;
    padding: 0 10px 0 11px;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .channels::before {
    content: '';
    position: absolute;
    left: 0;
    top: 3px;
    bottom: 3px;
    width: 1px;
    background: rgba(0, 0, 0, 0.08);
  }
</style>
