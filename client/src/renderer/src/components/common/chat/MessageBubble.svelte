<script lang="ts">
  import { userState } from '$src/states/UserState.svelte.js'
  import { formatTimestamp } from '$src/utils/DateUtils'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import type { Message } from '$src/interfaces/Messages'
  import { chatService } from '$src/services/ChatService'
  import EditIcon from '$src/components/svg/EditIcon.svelte'
  import TrashIcon from '$src/components/svg/TrashIcon.svelte'

  interface Props {
    message: Message
    showReadStatus?: boolean
  }

  let { message, showReadStatus = false }: Props = $props()

  let isEditing = $state(false)
  let editedContent = $derived(message.content)
  let showActions = $state(false)
  let showMenu = $state(false)
  let isSent = $derived(message.user.id === userState.currentUser?.id)

  function handleSaveEdit(): void {
    chatService.editMessage(message.id, editedContent)
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
  {#if !isSent}
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
            }}><EditIcon />Edit</button
          >
          <button class="delete" onclick={() => chatService.deleteMessage(message.id)}
            ><TrashIcon />Delete</button
          >
        </div>
      {/if}
    </div>
  {/if}

  <div class="bubble" class:sent={isSent}>
    {#if message.conversationType === 'CHANNEL' && message.user.id !== userState.currentUser?.id}
      <span class="username">{message.user.displayName}</span>
    {/if}

    {#if isEditing}
      <div class="editactions">
        <button class="editbut" onclick={handleSaveEdit}>Save</button>
        <button class="editbut" onclick={() => (isEditing = false)}>Cancel</button>
      </div>
      <input class="editinput" bind:value={editedContent} />
    {:else}
      <p class="text">{message.content}</p>
    {/if}
    <div class="meta">
      {#if message.isEdited}
        <span class="edited">edited</span>
      {/if}
      <span class="timestamp">{formatTimestamp(message.createdAt)}</span>
      {#if showReadStatus && isSent}
        <span class="checkmark">✓✓</span>
      {/if}
    </div>
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
    border: 1.5px solid #ebebeb;
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
    position: relative;
    padding: 10px 14px 8px;
    border-radius: 18px;
    max-width: 60%;
    width: fit-content;
    display: flex;
    flex-direction: column;
    gap: 2px;
    word-break: break-word;
    line-height: 1.5;
    font-size: 12px;
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

  .username {
    font-size: 11px;
    font-weight: 600;
    color: #f47e3a;
    letter-spacing: 0.02em;
    margin-bottom: 2px;
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

  .editinput::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 2px;
    font-size: 9px;
    align-self: flex-end;
  }

  .bubble:not(.sent) .meta {
    color: rgba(45, 45, 45, 0.5);
  }

  .bubble.sent .meta {
    color: rgba(45, 45, 45, 0.5);
  }

  .edited {
    font-style: italic;
  }

  .bubble.sent .checkmark {
    color: rgba(45, 45, 45, 0.5);
    font-size: 11px;
  }
</style>
