<script lang="ts">
  import { formatTimestamp } from '$src/utils/DateUtils'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import type { Message } from '$src/interfaces/Messages'
  import { chatService } from '$src/services/ChatService'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import type { IconName } from '$src/components/common/icons/icons'
  import { openExternalLink, parseLinks } from '$src/utils/LinksUtils'
  import MessageActions from '$src/components/common/chat/MessageActions.svelte'
  import MessageReactions from '$src/components/common/chat/MessageReactions.svelte'
  import { sessionState } from '$src/states/SessionState.svelte'

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

  let parsedContent = $derived(parseLinks(message.content))
  let editedContent = $derived(message.content)
  let isEditing = $state(false)
  let showActions = $state(false)

  const EMOJI_ONLY = /^(\p{Extended_Pictographic}|‍|️|[\u{1F3FB}-\u{1F3FF}]|\s)+$/u
  let isEmojiOnly = $derived(
    !message.imageAddress &&
      message.content.trim().length > 0 &&
      EMOJI_ONLY.test(message.content)
  )

  let isSent = $derived(message.user.id === sessionState.currentUser?.id)
  let checkmarkIcon: IconName = $derived(isRead ? 'checkmarkFilled' : 'checkmark')

  function handleSaveEdit(): void {
    onEditMessage(message, editedContent)
    isEditing = false
  }

  function onToggleReaction(emoji: string): void {
    const alreadyReacted = (message.reactions ?? []).some(
      (r) => r.emoji === emoji && r.userId === sessionState.currentUser?.id
    )
    if (alreadyReacted) {
      chatService.removeReaction(message, emoji)
    } else {
      chatService.addReaction(message, emoji)
    }
  }

  $effect(() => {
    if (isEditing) editedContent = message.content
  })
</script>

<div
  class="wrapper"
  class:sent={isSent}
  role="group"
  onmouseenter={() => (showActions = true)}
  onmouseleave={() => (showActions = false)}
>
  {#if !isSent && message.conversationType === 'CHANNEL'}
    <div class="avatar">
      <UserAvatar profilePictureUrl={message.user.profilePictureUrl} width={32} height={32} />
    </div>
  {/if}

  {#if showActions}
    <div class="actions-wrapper">
      <MessageActions
        {message}
        {isSent}
        currentUserId={sessionState.currentUser?.id}
        onStartEdit={() => (isEditing = true)}
        {onToggleReaction}
      />
    </div>
  {/if}

  <div class="message-column" class:sent={isSent}>
    {#if showDisplayName && message.conversationType === 'CHANNEL' && message.user.id !== sessionState.currentUser?.id}
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
        {#if message.imageAddress}
          <img class="attachment" src={message.imageAddress} alt="" />
        {/if}
        <p class="text" class:jumbo={isEmojiOnly}>
          {#each parsedContent as part, i (`${i}-${part.content}`)}
            {#if part.type === 'link'}
              <a href={part.href} class="chat-link" onclick={(e) => openExternalLink(e, part.href)}>
                {part.content}
              </a>
            {:else}
              {part.content}
            {/if}
          {/each}
        </p>
      {/if}
    </div>

    <MessageReactions {message} {onToggleReaction} />

    {#if showMeta}
      <div class="meta" class:sent={isSent}>
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

  .actions-wrapper {
    order: 3;
    align-self: center;
  }

  .wrapper.sent .actions-wrapper {
    order: 1;
  }

  .message-column {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-width: 60%;
    order: 2;
  }

  .message-column.sent {
    align-items: flex-end;
  }

  .bubble {
    padding: 10px 14px;
    border-radius: 18px;
    width: fit-content;
    word-break: break-word;
    line-height: 1.5;
    font-size: 14px;
    margin-top: 2px;
  }

  .bubble:not(.sent) {
    background: #f5ece0;
    color: #2d2d2d;
    border-bottom-left-radius: 4px;
  }

  .bubble.sent {
    background: #ff843c;
    color: #2d2d2d;
    border-bottom-right-radius: 4px;
  }

  .handle {
    font-size: 11px;
    font-weight: 600;
    color: #ff843c;
    letter-spacing: 0.02em;
    margin-bottom: 2px;
    padding-left: 6px;
  }

  .text {
    margin: 0;
    white-space: pre-wrap;
  }

  .text.jumbo {
    font-size: 40px;
    line-height: 1.1;
  }

  .chat-link {
    color: inherit;
    text-decoration: underline;
    cursor: pointer;
  }

  .bubble.sent .chat-link {
    color: #2d2d2d;
  }

  .bubble:not(.sent) .chat-link {
    color: #ff843c;
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

  .meta {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 2px;
    font-size: 10px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.35);
    align-self: flex-start;
  }

  .meta.sent {
    align-self: flex-end;
  }

  .edited {
    font-style: italic;
  }

  .attachment {
    display: block;
    width: 100%;
    max-height: 320px;
    object-fit: cover;
    border-radius: 12px;
    margin: -2px 0 8px;
  }

  .bubble:has(.attachment) .text:empty {
    display: none;
  }
</style>
