<script lang="ts">
  import type { Gif } from '$src/services/GifService'
  import PreviewBar from './PreviewBar.svelte'
  import MessageTextarea from './MessageTextarea.svelte'
  import AttachButton from '$src/components/common/chat/input/AttachButton.svelte'
  import GifButton from '$src/components/common/chat/input/GifButton.svelte'
  import { instanceState } from '$src/states/InstanceState.svelte'
  import EmojiButton from '$src/components/common/chat/input/EmojiButton.svelte'
  import SendButton from '$src/components/common/chat/input/SendButton.svelte'

  interface PendingFile {
    file: File
    inline: boolean
  }

  let {
    selectedContent,
    messageInput = $bindable(''),
    onSubmit,
    allowFileAttachments = true,
    fileUploadEnabled = true
  }: {
    selectedContent: boolean
    messageInput: string
    onSubmit: (
      event: SubmitEvent,
      files: File[],
      inlineFiles: File[],
      gifUrl: string | null
    ) => void
    allowFileAttachments?: boolean
    fileUploadEnabled?: boolean
  } = $props()

  let attachedGifUrl = $state<string | null>(null)
  let gifPreviewUrl = $state<string | null>(null)
  let isDraggingFile = $state(false)
  let dragCounter = 0
  let pendingFiles = $state<PendingFile[]>([])
  let textareaRef: MessageTextarea

  export function focus(): void {
    textareaRef?.focus()
  }

  function queuePendingFiles(files: File[], inline = false): void {
    if (files.length === 0 || (!allowFileAttachments && !inline) || !fileUploadEnabled) return
    const filtered = inline ? files.filter((f) => f.type.startsWith('image/')) : files
    if (filtered.length === 0) return
    pendingFiles = [...pendingFiles, ...filtered.map((file) => ({ file, inline }))]
  }

  function removePendingFile(index: number): void {
    pendingFiles = pendingFiles.filter((_, i) => i !== index)
  }

  function removeGif(): void {
    attachedGifUrl = null
    gifPreviewUrl = null
  }

  function handleGifSelect(gif: Gif): void {
    attachedGifUrl = gif.gifUrl
    gifPreviewUrl = gif.gifUrl
    textareaRef?.focus()
  }

  function handleEmojiSelect(emoji: string): void {
    messageInput += emoji
    textareaRef?.focus()
  }

  function handleFormSubmit(e: SubmitEvent): void {
    e.preventDefault()
    const regularFiles = pendingFiles.filter((p) => !p.inline).map((p) => p.file)
    const inlineFiles = pendingFiles.filter((p) => p.inline).map((p) => p.file)
    onSubmit(e, regularFiles, inlineFiles, attachedGifUrl)
    pendingFiles = []
    messageInput = ''
    removeGif()
  }

  function handleDragEnter(event: DragEvent): void {
    if (!allowFileAttachments || !selectedContent) return
    if (!event.dataTransfer?.types?.includes('Files')) return
    event.preventDefault()
    dragCounter++
    isDraggingFile = true
  }

  function handleDragOver(event: DragEvent): void {
    if (!allowFileAttachments || !selectedContent) return
    if (!event.dataTransfer?.types?.includes('Files')) return
    event.preventDefault()
  }

  function handleDragLeave(event: DragEvent): void {
    if (!allowFileAttachments || !selectedContent) return
    event.preventDefault()
    dragCounter = Math.max(0, dragCounter - 1)
    if (dragCounter === 0) isDraggingFile = false
  }

  function handleDrop(event: DragEvent): void {
    if (!allowFileAttachments || !selectedContent) return
    event.preventDefault()
    dragCounter = 0
    isDraggingFile = false
    const files = event.dataTransfer?.files
    if (files && files.length > 0) queuePendingFiles(Array.from(files))
  }
</script>

<div
  class="pane chat-page"
  class:drag-over={isDraggingFile}
  role="group"
  aria-label="Message composer"
  ondragenter={handleDragEnter}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
>
  {#if isDraggingFile}
    <div class="drag-overlay">Drop to share with this channel</div>
  {/if}

  <form class="input-container" onsubmit={handleFormSubmit}>
    {#if gifPreviewUrl || pendingFiles.length > 0}
      <PreviewBar
        {gifPreviewUrl}
        {pendingFiles}
        onRemoveGif={removeGif}
        onRemoveFile={removePendingFile}
      />
    {/if}

    <div class="input-area">
      {#if allowFileAttachments}
        <AttachButton
          disabled={!selectedContent}
          locked={!fileUploadEnabled}
          onFilesSelected={(files) => queuePendingFiles(files)}
        />
      {/if}

      <MessageTextarea
        bind:this={textareaRef}
        bind:value={messageInput}
        disabled={!selectedContent}
        {allowFileAttachments}
        onImagePasted={(file) => queuePendingFiles([file], true)}
      />

      {#if instanceState.gifsEnabled}
        <GifButton onSelect={handleGifSelect} />
      {/if}
      <EmojiButton onSelect={handleEmojiSelect} />

      <SendButton
        disabled={!selectedContent ||
          (!messageInput.trim() && !attachedGifUrl && pendingFiles.length === 0)}
      />
    </div>
  </form>
</div>

<style>
  .chat-page {
    position: relative;
    flex-shrink: 0;
  }

  .chat-page.drag-over {
    border-color: #ff843c;
    background-color: rgba(255, 132, 60, 0.04);
  }

  .drag-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 132, 60, 0.08);
    border-radius: 20px;
    color: #ff843c;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
    pointer-events: none;
    z-index: 50;
  }

  .input-container {
    display: flex;
    flex-direction: column;
  }

  .input-area {
    display: flex;
    align-items: center;
    padding: 14px 18px;
    gap: 8px;
  }
</style>
