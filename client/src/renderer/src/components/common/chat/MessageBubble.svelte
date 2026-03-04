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
  let editedContent = $state(message.content)
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
  {#if !isSent && showActions}
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
      <span class="username">{message.user.username}</span>
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

  .msgoptions-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    align-self: center;
  }

  .editinput {
    border-radius: 5px;
    border: none;
  }

  .editinput:focus {
    outline: none;
  }

  .editactions {
    display: flex;
    gap: 4px;
  }

  .editbut {
    background: none;
    border: none;
    color: #f8ebd2;
    font-size: 11px;
    font-style: italic;
    cursor: pointer;
    padding: 2px 6px;
  }

  .editbut:hover {
    color: #ffffff;
  }

  .msgoptions {
    position: absolute;
    right: 110%;
    display: flex;
    flex-direction: column;
    background: #f8ebd2;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 10;
    overflow: hidden;
  }

  .msgoptions button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px 16px;
    color: #f47e3a;
    font-size: 11px;
    font-family: Hei, serif;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .msgoptions button:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .menudots {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    color: #f47e3a;
    padding: 4px;
    line-height: 1;
    border-radius: 4px;
  }

  .menudots:hover {
    color: #f47e3a;
    background: rgba(0, 0, 0, 0.05);
  }

  .avatar {
    flex-shrink: 0;
    margin-bottom: 2px;
  }

  .bubble {
    position: relative;
    padding: 10px 14px 8px;
    border-radius: 20px;
    max-width: 60%;
    width: fit-content;
    display: flex;
    flex-direction: column;
    gap: 2px;
    word-break: break-word;
    line-height: 1.45;
    font-size: 14px;
  }

  .bubble:not(.sent) {
    background-color: #f5ecd5;
    color: #2d2d2d;
    border-bottom-left-radius: 4px;
  }

  .bubble.sent {
    background-color: #f47e3a;
    color: #2d2d2d;
    border-bottom-right-radius: 4px;
  }

  .username {
    font-size: 12px;
    font-weight: 700;
    color: #f47e3a;
    letter-spacing: 0.01em;
    margin-bottom: 2px;
  }

  .text {
    margin: 0;
    white-space: pre-wrap;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 3px;
    font-size: 10px;
    opacity: 0.55;
    align-self: flex-end;
  }

  .bubble.sent .checkmark {
    opacity: 1;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.9);
  }

  .edited {
    font-style: italic;
  }
</style>
