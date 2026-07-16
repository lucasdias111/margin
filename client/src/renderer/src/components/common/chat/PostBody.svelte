<script lang="ts">
  import type { Message } from '$src/interfaces/Messages'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import MessageReactions from '$src/components/common/chat/MessageReactions.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import LoadingImage from '$src/components/common/media/LoadingImage.svelte'
  import { formatTimestamp } from '$src/utils/DateUtils'
  import { openExternalLink, parseLinks } from '$src/utils/LinksUtils'
  import { reactionService } from '$src/services/ReactionService'
  import { sessionState } from '$src/states/SessionState.svelte'

  const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢']

  interface Props {
    message: Message
    onEditMessage: (message: Message, editedContent: string) => void
  }

  let { message, onEditMessage }: Props = $props()

  let isEditing = $state(false)
  let editedContent = $state('')

  const parsedContent = $derived(parseLinks(message.content))
  const isOwn = $derived(message.user.id === sessionState.currentUser?.id)

  function isInlineImageUrl(url: string): boolean {
    return /\.(gif|png|jpe?g|webp)(\?|$)/i.test(url) || /static\.klipy\.com/i.test(url)
  }

  function hasReacted(emoji: string): boolean {
    return (message.reactions ?? []).some(
      (r) => r.emoji === emoji && r.userId === sessionState.currentUser?.id
    )
  }

  function onToggleReaction(emoji: string): void {
    if (hasReacted(emoji)) {
      reactionService.removeReaction(message, emoji)
    } else {
      reactionService.addReaction(message, emoji)
    }
  }

  function startEdit(): void {
    editedContent = message.content
    isEditing = true
  }

  function saveEdit(): void {
    onEditMessage(message, editedContent)
    isEditing = false
  }
</script>

<article class="post-body">
  <header class="post-author">
    <UserAvatar profilePictureUrl={message.user.profilePictureUrl} width={36} height={36} />
    <div class="author-meta">
      <span class="author-name">{message.user.displayName}</span>
      <span class="post-time">
        {formatTimestamp(message.createdAt)}
        {#if message.isEdited}<span class="edited">· edited</span>{/if}
      </span>
    </div>
  </header>

  {#if isEditing}
    <textarea class="edit-input" rows="4" bind:value={editedContent}></textarea>
    <div class="edit-actions">
      <button type="button" class="edit-cancel" onclick={() => (isEditing = false)}>Cancel</button>
      <button type="button" class="edit-save" onclick={saveEdit}>Save</button>
    </div>
  {:else}
    <p class="post-text">
      {#each parsedContent as part, i (`${i}-${part.content}`)}
        {#if part.type === 'link' && part.href && isInlineImageUrl(part.href)}
          <LoadingImage class="inline-media" src={part.href} alt="" block />
        {:else if part.type === 'link'}
          <a href={part.href} class="post-link" onclick={(e) => openExternalLink(e, part.href)}>
            {part.content}
          </a>
        {:else}
          {part.content}
        {/if}
      {/each}
    </p>
  {/if}

  <MessageReactions {message} {onToggleReaction} />

  <footer class="post-actions">
    {#each QUICK_EMOJIS as emoji (emoji)}
      <button
        type="button"
        class="action-btn emoji"
        class:reacted={hasReacted(emoji)}
        onclick={() => onToggleReaction(emoji)}
      >
        {emoji}
      </button>
    {/each}
    {#if isOwn && !isEditing}
      <span class="action-separator"></span>
      <button type="button" class="action-btn edit" onclick={startEdit}>
        <Icon name="edit" size={13} />
        Edit
      </button>
    {/if}
  </footer>
</article>

<style>
  .post-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    box-sizing: border-box;
    padding: 16px 18px 12px;
    background: #fff;
    border: 1px solid #ece8e0;
    border-radius: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .post-author {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .author-meta {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .author-name {
    font-size: 14px;
    font-weight: 700;
    color: #1a1a1a;
  }

  .post-time {
    font-size: 11px;
    color: #aaa;
  }

  .edited {
    font-style: italic;
  }

  .post-text {
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
    color: #2d2d2d;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .post-link {
    color: #e8712a;
    text-decoration: underline;
    cursor: pointer;
  }

  .post-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    padding-top: 8px;
    border-top: 1px solid #f2eee8;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: none;
    border-radius: 8px;
    padding: 4px 8px;
    font-family: inherit;
    font-size: 14px;
    line-height: 1;
    color: #888;
    cursor: pointer;
    transition:
      background 0.12s,
      transform 0.1s;
  }

  .action-btn:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .action-btn.emoji:hover {
    transform: scale(1.15);
  }

  .action-btn.emoji.reacted {
    background: rgba(244, 126, 58, 0.12);
  }

  .action-btn.edit {
    font-size: 12px;
    font-weight: 600;
  }

  .action-separator {
    width: 1px;
    height: 16px;
    background: #ece8e0;
    margin: 0 4px;
  }

  .edit-input {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
  }

  .edit-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .edit-cancel {
    background: none;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    padding: 6px 14px;
    font-family: inherit;
    font-size: 12px;
    cursor: pointer;
    color: #2d2d2d;
  }

  .edit-save {
    background: #ff6203;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 6px 14px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  .post-body :global(.inline-media) {
    max-width: 360px;
    max-height: 320px;
    border-radius: 10px;
    margin: 6px 0;
    overflow: hidden;
  }

  .post-body :global(.inline-media img) {
    display: block;
    max-width: 100%;
    max-height: 320px;
    border-radius: 10px;
  }
</style>
