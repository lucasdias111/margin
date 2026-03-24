<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte.js'
  import type { CreateMargin, Margin } from '$src/interfaces/Margin'
  import CreateMarginModal from '$src/components/content/manage/margin/modals/CreateMarginModal.svelte'
  import { spacesService } from '$src/services/SpacesService'
  import { marginService } from '$src/services/MarginService'
  import { clickOutside } from '$src/actions/clickOutside'
  import UnreadNotificationBadge from '$src/components/common/chat/UnreadNotificationBadge.svelte'
  import { notificationState } from '$src/states/NotificationState.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'

  let open = $state(false)
  let createMarginOpen = $state(false)

  function selectMargin(margin: Margin): void {
    chatState.selectMargin(margin)
    spacesService.getAllSpacesForUser(chatState.selectedMargin.marginId)
    open = false
  }

  function close(): void {
    createMarginOpen = false
    open = false
  }

  async function createMargin(createRequest: CreateMargin): Promise<void> {
    const newMargin = await marginService.createMargin(createRequest)
    chatState.selectMargin(newMargin)
    marginService.addNewMargin(newMargin)
    close()
  }

  const unreadPerMargin = $derived(
    new Map(
      chatState.margins.map((m) => [
        m.marginId,
        notificationState.unreadChannelMessages.filter((msg) => msg.marginId === m.marginId)
          .length + (notificationState.unseenAnnouncementCounts.get(m.marginId) ?? 0)
      ])
    )
  )
</script>

<div class="switcher-wrapper" use:clickOutside={() => (open = false)}>
  <button class="switcher-btn" onclick={() => (open = !open)}>
    <Icon name="grid" size={14} />
    Switch margin
    <span class="chevron" class:rotated={open}>
      <Icon name="chevronRight" size={12} strokeWidth={2.5} />
    </span>
  </button>

  {#if open}
    <div class="dropdown">
      {#each chatState.margins as margin (margin.marginId)}
        {@const unread = unreadPerMargin.get(margin.marginId) ?? 0}
        <button
          class="margin-item"
          class:active={chatState.selectedMargin?.marginId === margin.marginId}
          onclick={() => selectMargin(margin)}
        >
          <span class="margin-avatar">{margin.marginName?.[0]?.toUpperCase() ?? '?'}</span>
          <span class="margin-name">{margin.marginName}</span>
          <span class="margin-actions">
            <UnreadNotificationBadge shouldShow={unread > 0} count={unread} variant="inline" />
          </span>
        </button>
      {/each}
      <button class="margin-item" onclick={() => (createMarginOpen = true)}
        >Create new margin
      </button>
    </div>
  {/if}
  <CreateMarginModal open={createMarginOpen} onCreate={createMargin} onClose={close} />
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
    display: flex;
  }

  .chevron.rotated {
    transform: rotate(90deg);
  }

  .dropdown {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(100% + 4px);
    margin-left: 0;
    min-width: unset;
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
    background: rgba(228, 113, 42, 0.08);
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

  .margin-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
</style>
