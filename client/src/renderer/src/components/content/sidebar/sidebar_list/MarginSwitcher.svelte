<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte.js'
  import type { CreateMargin, Margin } from '$src/interfaces/Margin'
  import CreateMarginModal from '$src/components/content/manage/margin/modals/CreateMarginModal.svelte'
  import { marginService } from '$src/services/MarginService'
  import { clickOutside } from '$src/actions/clickOutside'
  import UnreadNotificationBadge from '$src/components/common/chat/UnreadNotificationBadge.svelte'
  import { notificationState } from '$src/states/NotificationState.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { marginInviteService } from '$src/services/MarginInviteService'
  import Button from '$src/components/common/buttons/Button.svelte'

  let open = $state(false)
  let createMarginOpen = $state(false)
  let joinCode = $state('')
  let joinLoading = $state(false)
  let joinError = $state<string | null>(null)

  async function handleJoinWithCode(): Promise<void> {
    if (!joinCode.trim()) return
    joinLoading = true
    joinError = null
    try {
      const margin = await marginInviteService.acceptLinkInvite(joinCode.trim())
      chatState.selectMargin(margin)
      marginService.addNewMargin(margin)
      joinCode = ''
      open = false
    } catch (e) {
      joinError = 'Invalid or expired code'
    } finally {
      joinLoading = false
    }
  }

  function selectMargin(margin: Margin): void {
    chatState.selectMargin(margin)
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
        notificationState.getTotalUnreadForMargin(m.marginId)
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
      <div class="margin-list">
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
      </div>

      <div class="join-divider"></div>
      <Button
        buttonType="secondary"
        size="small"
        onClick={() => (createMarginOpen = true)}
        text="Create new margin"
        fullWidth
      />

      <div class="join-section">
        <span class="join-label">Join with invite code</span>
        <div class="join-row">
          <input
            class="join-input"
            type="text"
            placeholder="Paste code"
            bind:value={joinCode}
            maxlength="36"
            onkeydown={(e) => {
              if (e.key === 'Enter') handleJoinWithCode()
            }}
          />
          <Button
            buttonType="primary"
            size="small"
            onClick={handleJoinWithCode}
            disabled={joinLoading || !joinCode.trim()}
            text={joinLoading ? '...' : 'Join'}
          />
        </div>
        {#if joinError}
          <span class="join-error">{joinError}</span>
        {/if}
      </div>
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

  .join-divider {
    height: 1px;
    background: #ece8e0;
    margin: 4px 6px;
  }

  .join-section {
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .join-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #888;
  }

  .join-row {
    display: flex;
    gap: 6px;
  }

  .join-input {
    flex: 1;
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid #ece8e0;
    background: #fafafa;
    font-family: monospace;
    font-size: 12px;
    color: #2a2a2a;
    outline: none;
    min-width: 0;
  }

  .join-input:focus {
    border-color: #f47e3a;
    background: white;
  }

  .join-error {
    font-size: 11px;
    color: #c0392b;
  }

  .margin-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .margin-list::-webkit-scrollbar {
    width: 3px;
  }

  .margin-list::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }
</style>
