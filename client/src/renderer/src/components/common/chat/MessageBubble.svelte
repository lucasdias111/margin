<script lang="ts">
  import { formatTimestamp } from '$src/utils/DateUtils'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import type { Message } from '$src/interfaces/Messages'
  import type { StoredFile } from '$src/interfaces/StoredFile'
  import { messageSenderService } from '$src/services/MessageSenderService'
  import { reactionService } from '$src/services/ReactionService'
  import { fileStorageService } from '$src/services/FileStorageService'
  import { imageService } from '$src/services/ImageService'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import type { IconName } from '$src/components/common/icons/icons'
  import { openExternalLink, parseLinks } from '$src/utils/LinksUtils'
  import MessageActions from '$src/components/common/chat/MessageActions.svelte'
  import MessageReactions from '$src/components/common/chat/MessageReactions.svelte'
  import ImagePreviewModal from '$src/components/common/modals/ImagePreviewModal.svelte'
  import LoadingImage from '$src/components/common/media/LoadingImage.svelte'
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
  let attachments = $derived(message.attachments ?? [])
  let localAttachments = $derived(message.localAttachments ?? [])
  let hasAttachments = $derived(attachments.length > 0 || localAttachments.length > 0)
  let isSending = $derived(message.status === 'sending')
  let isFailed = $derived(message.status === 'error')

  function retrySend(): void {
    messageSenderService.retryMessage(message)
  }

  const EMOJI_ONLY = /^(\p{Extended_Pictographic}|‍|️|[\u{1F3FB}-\u{1F3FF}]|\s)+$/u
  let isEmojiOnly = $derived(
    !hasAttachments &&
      message.content.trim().length > 0 &&
      EMOJI_ONLY.test(message.content)
  )

  function isImage(file: StoredFile): boolean {
    return file.contentType?.startsWith('image/') ?? false
  }

  function formatBytes(n: number): string {
    if (n < 1024) return `${n} B`
    if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
    return `${(n / (1024 * 1024)).toFixed(1)} MB`
  }

  function downloadAttachment(file: StoredFile): void {
    fileStorageService.downloadFile(file.fileId)
  }

  let preview = $state<{ file: StoredFile; src: string } | null>(null)

  async function openImagePreview(file: StoredFile): Promise<void> {
    try {
      const src = await imageService.getAuthenticatedImageUrl(file.url)
      preview = { file, src }
    } catch {
      preview = null
    }
  }

  function isInlineImageUrl(url: string): boolean {
    return /\.(gif|png|jpe?g|webp)(\?|$)/i.test(url) || /static\.klipy\.com/i.test(url)
  }

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
      reactionService.removeReaction(message, emoji)
    } else {
      reactionService.addReaction(message, emoji)
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
  {#if !isSent && (message.conversationType === 'CHANNEL' || message.conversationType === 'GROUP')}
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
    {#if showDisplayName && (message.conversationType === 'CHANNEL' || message.conversationType === 'GROUP') && message.user.id !== sessionState.currentUser?.id}
      <span class="handle">{message.user.displayName}</span>
    {/if}

    <div class="bubble" class:sent={isSent} class:sending={isSending} class:failed={isFailed}>
      {#if isEditing}
        <div class="editactions">
          <button class="editbut" onclick={handleSaveEdit}>Save</button>
          <button class="editbut" onclick={() => (isEditing = false)}>Cancel</button>
        </div>
        <input class="editinput" bind:value={editedContent} />
      {:else}
        {#if localAttachments.length > 0}
          <div class="attachments">
            {#each localAttachments as att (att.previewUrl)}
              {#if att.contentType.startsWith('image/')}
                <div class="image-attachment local">
                  <img src={att.previewUrl} alt={att.fileName} />
                </div>
              {:else}
                <div class="file-attachment local">
                  <Icon name="upload" size={20} />
                  <span class="file-meta">
                    <span class="file-name">{att.fileName}</span>
                  </span>
                </div>
              {/if}
            {/each}
          </div>
        {/if}
        {#if attachments.length > 0}
          <div class="attachments">
            {#each attachments as att (att.fileId)}
              {#if isImage(att)}
                {#await imageService.getAuthenticatedImageUrl(att.url)}
                  <!-- loading -->
                {:then src}
                  <button
                    type="button"
                    class="image-attachment"
                    onclick={() => openImagePreview(att)}
                    aria-label={`Preview ${att.fileName}`}
                  >
                    <LoadingImage {src} alt={att.fileName} class="attachment-thumb" />
                  </button>
                {:catch}
                  <span class="attachment-failed">Image unavailable</span>
                {/await}
              {:else}
                <button
                  type="button"
                  class="file-attachment"
                  onclick={() => downloadAttachment(att)}
                >
                  <Icon name="upload" size={20} />
                  <span class="file-meta">
                    <span class="file-name">{att.fileName}</span>
                    <span class="file-size">{formatBytes(att.sizeBytes)}</span>
                  </span>
                </button>
              {/if}
            {/each}
          </div>
        {/if}
        <p class="text" class:jumbo={isEmojiOnly}>
          {#each parsedContent as part, i (`${i}-${part.content}`)}
            {#if part.type === 'link' && part.href && isInlineImageUrl(part.href)}
              <LoadingImage class="inline-media" src={part.href} alt="" block />
            {:else if part.type === 'link'}
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

    <ImagePreviewModal
      open={preview !== null}
      src={preview?.src ?? ''}
      fileName={preview?.file.fileName ?? ''}
      onClose={() => (preview = null)}
      onDownload={() => preview && downloadAttachment(preview.file)}
    />

    {#if showMeta}
      <div class="meta" class:sent={isSent}>
        {#if message.isEdited}
          <span class="edited">edited</span>
        {/if}
        <span class="timestamp">{formatTimestamp(message.createdAt)}</span>
        {#if isSent && isSending}
          <span class="status">Sending…</span>
        {:else if isSent && isFailed}
          <button type="button" class="retry" onclick={retrySend}>Failed — Retry</button>
        {:else if isSent && showReadStatus}
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

  .bubble.sending {
    opacity: 0.7;
  }

  .bubble.failed {
    box-shadow: inset 0 0 0 1.5px rgba(214, 69, 69, 0.6);
  }

  .status {
    font-style: italic;
    opacity: 0.7;
  }

  .retry {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    font: inherit;
    font-weight: 600;
    color: #d64545;
    cursor: pointer;
  }

  .retry:hover {
    text-decoration: underline;
  }

  .attachments {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: -2px 0 8px;
  }

  .image-attachment {
    display: block;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 12px;
    overflow: hidden;
    max-width: 320px;
  }

  .image-attachment :global(.attachment-thumb) {
    width: 100%;
  }

  .image-attachment :global(.attachment-thumb:not(.is-loaded)) {
    width: 220px;
    height: 160px;
  }

  .image-attachment :global(.attachment-thumb img) {
    display: block;
    width: 100%;
    max-height: 320px;
    object-fit: cover;
  }

  .attachment-failed {
    display: inline-block;
    font-size: 12px;
    font-style: italic;
    color: rgba(0, 0, 0, 0.4);
  }

  .file-attachment {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    background: rgba(255, 255, 255, 0.5);
    border-radius: 10px;
    cursor: pointer;
    font-family: inherit;
    color: inherit;
    text-align: left;
    max-width: 260px;
  }

  .file-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .file-name {
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-size {
    font-size: 11px;
    opacity: 0.6;
  }

  .bubble:has(.attachments) .text:empty {
    display: none;
  }

  :global(.inline-media) {
    max-width: 280px;
    max-height: 280px;
    border-radius: 10px;
    margin: 4px 0;
    overflow: hidden;
  }

  :global(.inline-media:not(.is-loaded)) {
    width: 160px;
    height: 120px;
  }

  :global(.inline-media img) {
    display: block;
    max-width: 100%;
    max-height: 280px;
    border-radius: 10px;
  }
</style>
