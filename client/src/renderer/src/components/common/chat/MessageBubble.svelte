<script lang="ts">
  import { userState } from '$src/states/UserState.svelte.js'
  import { formatTimestamp } from '$src/utils/DateUtils'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import type { Message } from '$src/interfaces/Messages'
  import { chatService } from '$src/services/ChatService'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import type { IconName } from '$src/components/common/icons/icons'

  interface Props {
    message: Message
    showMeta?: boolean
    showDisplayName?: boolean
    isRead?: boolean
    showReadStatus?: boolean
    onEditMessage: (e: Message, editedContent: string) => void
  }

  let {
    message,
    showMeta = true,
    showDisplayName = true,
    isRead = false,
    showReadStatus = false,
    onEditMessage
  }: Props = $props()

  let isEditing = $state(false)
  let editedContent = $derived(message.content)
  let showActions = $state(false)
  let showMenu = $state(false)
  let isSent = $derived(message.user.id === userState.currentUser?.id)
  let checkmarkIcon: IconName = $derived(isRead ? 'checkmarkFilled' : 'checkmark')

  function handleSaveEdit(): void {
    onEditMessage(message, editedContent)
    isEditing = false
  }
</script>

<div
  class="wrapper"
  class:sent={isSent}
  role="group"
  onmouseenter={() => (showActions = true)}
  onmouseleave={() => {
    showActions = false
    showMenu = false
  }}
>
  {#if !isSent && message.conversationType === 'CHANNEL'}
    <div class="avatar">
      <UserAvatar profilePictureUrl={message.user.profilePictureUrl} width={32} height={32} />
    </div>
  {/if}

  {#if isSent && showActions}
    <div class="msgoptions-wrapper">
      <button class="menudots" onclick={() => (showMenu = !showMenu)}>⋮</button>
      {#if showMenu}
        <div class="msgoptions">
          <button
            class="edit"
            onclick={() => {
              isEditing = true
              showMenu = false
            }}
          >
            <Icon name="edit" size={14} />
            Edit
          </button>
          <button class="delete" onclick={() => chatService.deleteMessage(message)}>
            <Icon name="trash" size={14} />
            Delete
          </button>
        </div>
      {/if}
    </div>
  {/if}

  <div class="message-column" class:sent={isSent}>
    {#if showDisplayName && message.conversationType === 'CHANNEL' && message.user.id !== userState.currentUser?.id}
      <span class="handle">{message.user.displayName}</span>
    {/if}

    <div class="bubble" class:sent={isSent}>
      {#if isEditing}
        <div class="editactions">
          <button class="editbut" onclick={handleSaveEdit}>Save</button>
          <button class="editbut" onclick={() => (isEditing = false)}>Cancel</button>
        </div>
        <input class="editinput" bind:value={editedContent} />
      {:else}
        <p class="text">{message.content}</p>
      {/if}
    </div>

    {#if showMeta}
      <div class="meta">
        {#if message.isEdited}
          <span class="edited">edited</span>
        {/if}
        <span class="timestamp">{formatTimestamp(message.createdAt)}</span>
        {#if isSent && showReadStatus}
          <Icon name={checkmarkIcon} size={12} />
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .wrapper {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    width: 100%;
    justify-content: flex-start;
  }

  .wrapper.sent {
    justify-content: flex-end;
  }

  .avatar {
    flex-shrink: 0;
    margin-bottom: 2px;
  }

  .message-column {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-width: 60%;
  }

  .message-column.sent {
    align-items: flex-end;
  }

  .msgoptions-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    align-self: center;
  }

  .menudots {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    color: #bbb;
    padding: 4px 6px;
    line-height: 1;
    border-radius: 7px;
    transition:
      background 0.12s,
      color 0.12s;
  }

  .menudots:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #888;
  }

  .msgoptions {
    position: absolute;
    right: calc(100% + 6px);
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    background: white;
    border: 2px solid #ebebeb;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    z-index: 10;
    overflow: hidden;
    min-width: 110px;
    padding: 4px;
  }

  .msgoptions button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 7px 12px;
    border-radius: 9px;
    font-size: 13px;
    font-family: inherit;
    font-weight: 500;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 8px;
    transition:
      background 0.12s,
      color 0.12s;
  }

  .msgoptions .edit {
    color: #2a2a2a;
  }

  .msgoptions .edit:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  .msgoptions .delete {
    color: #c0392b;
  }

  .msgoptions .delete:hover {
    background: rgba(192, 57, 43, 0.07);
  }

  .bubble {
    padding: 10px 14px;
    border-radius: 18px;
    width: fit-content;
    min-width: 50px;
    word-break: break-word;
    line-height: 1.5;
    font-size: 14px;
  }

  .bubble:not(.sent) {
    background: #f5ece0;
    color: #2d2d2d;
    border-bottom-left-radius: 4px;
  }

  .bubble.sent {
    background: #f47e3a;
    color: #2d2d2d;
    border-bottom-right-radius: 4px;
  }

  .handle {
    font-size: 11px;
    font-weight: 600;
    color: #f47e3a;
    letter-spacing: 0.02em;
    margin-bottom: 2px;
    padding-left: 6px;
  }

  .text {
    margin: 0;
    white-space: pre-wrap;
  }

  .editactions {
    display: flex;
    gap: 4px;
    margin-bottom: 4px;
  }

  .editbut {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 6px;
    color: white;
    font-size: 11px;
    font-family: inherit;
    cursor: pointer;
    padding: 2px 8px;
    transition: background 0.12s;
  }

  .editbut:hover {
    background: rgba(255, 255, 255, 0.35);
  }

  .editinput {
    background: rgba(255, 255, 255, 0.2);
    border: 1.5px solid rgba(255, 255, 255, 0.4);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    font-family: inherit;
    padding: 4px 8px;
    outline: none;
    width: 100%;
    box-sizing: border-box;
  }

  .editinput:focus {
    border-color: rgba(255, 255, 255, 0.7);
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 3px;
    padding: 0 6px;
    font-size: 10px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.4);
  }

  .edited {
    font-style: italic;
  }

  .message-column.clumped {
    margin-bottom: -4px;
  }
</style>
