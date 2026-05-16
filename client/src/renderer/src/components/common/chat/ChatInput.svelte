<script lang="ts">
  import { Picker } from 'emoji-mart'
  import data from '@emoji-mart/data'
  import { clickOutside } from '$src/actions/clickOutside'
  import { replaceEmoticons } from '$src/utils/EmoticonUtils'
  import { compressImage } from '$src/utils/ImageUtils'
  import { formatFileSize } from '$src/utils/FileSizeUtils'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import GifPicker from '$src/components/common/chat/GifPicker.svelte'
  import type { Gif } from '$src/services/GifService'

  let {
    selectedContent,
    messageInput = $bindable(''),
    onSubmit,
    onAttachFiles
  }: {
    selectedContent: boolean
    messageInput: string
    onSubmit: (event: SubmitEvent, file: File | null, imageUrl: string | null) => void
    onAttachFiles?: (files: File[]) => void
  } = $props()

  let showPicker = $state(false)
  let showGifPicker = $state(false)
  let inputRef = $state<HTMLTextAreaElement | null>(null)
  let attachedFile = $state<File | null>(null)
  let attachedGifUrl = $state<string | null>(null)
  let previewUrl = $state<string | null>(null)
  let fileInputRef = $state<HTMLInputElement | null>(null)
  let isDraggingFile = $state(false)
  let dragCounter = 0
  let pendingFiles = $state<File[]>([])

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === ' ') {
      messageInput = replaceEmoticons(messageInput)
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      inputRef?.form?.requestSubmit()
    }
  }

  async function handlePaste(e: ClipboardEvent): Promise<void> {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          e.preventDefault()
          const compressed = await compressImage(file)
          setAttachment(compressed)
        }
      }
    }
  }

  function setAttachment(file: File): void {
    if (previewUrl && attachedFile) URL.revokeObjectURL(previewUrl)

    attachedFile = file
    attachedGifUrl = null
    previewUrl = URL.createObjectURL(file)
  }

  function setGifAttachment(gif: Gif): void {
    if (previewUrl && attachedFile) URL.revokeObjectURL(previewUrl)

    attachedFile = null
    attachedGifUrl = gif.gifUrl
    previewUrl = gif.gifUrl
    showGifPicker = false
    inputRef?.focus()
  }

  function removeAttachment(): void {
    if (previewUrl && attachedFile) URL.revokeObjectURL(previewUrl)
    attachedFile = null
    attachedGifUrl = null
    previewUrl = null
  }

  function handleFormSubmit(e: SubmitEvent): void {
    e.preventDefault()
    onSubmit(e, attachedFile, attachedGifUrl)

    if (pendingFiles.length > 0) {
      onAttachFiles?.(pendingFiles)
      pendingFiles = []
    }

    messageInput = ''
    removeAttachment()
  }

  function queuePendingFiles(files: File[]): void {
    if (files.length === 0) return
    pendingFiles = [...pendingFiles, ...files]
  }

  function removePendingFile(index: number): void {
    pendingFiles = pendingFiles.filter((_, i) => i !== index)
  }

  export function focus(): void {
    inputRef?.focus()
  }

  function handleAttachClick(): void {
    fileInputRef?.click()
  }

  function handleAttachChange(event: Event): void {
    const input = event.target as HTMLInputElement
    const files = input.files
    if (files && files.length > 0) {
      queuePendingFiles(Array.from(files))
    }
    input.value = ''
  }

  function handleDragEnter(event: DragEvent): void {
    if (!onAttachFiles || !selectedContent) return
    if (!event.dataTransfer?.types?.includes('Files')) return
    event.preventDefault()
    dragCounter++
    isDraggingFile = true
  }

  function handleDragOver(event: DragEvent): void {
    if (!onAttachFiles || !selectedContent) return
    if (!event.dataTransfer?.types?.includes('Files')) return
    event.preventDefault()
  }

  function handleDragLeave(event: DragEvent): void {
    if (!onAttachFiles || !selectedContent) return
    event.preventDefault()
    dragCounter = Math.max(0, dragCounter - 1)
    if (dragCounter === 0) {
      isDraggingFile = false
    }
  }

  function handleDrop(event: DragEvent): void {
    if (!onAttachFiles || !selectedContent) return
    event.preventDefault()
    dragCounter = 0
    isDraggingFile = false
    const files = event.dataTransfer?.files
    if (files && files.length > 0) {
      queuePendingFiles(Array.from(files))
    }
  }

  function emojiPicker(node: HTMLElement): { destroy(): void } {
    const picker = new Picker({
      data,
      onEmojiSelect: (emoji: any) => {
        messageInput += emoji.native
        showPicker = false
        inputRef?.focus()
      }
    })
    node.appendChild(picker as unknown as Node)

    return {
      destroy() {
        node.innerHTML = ''
      }
    }
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
    {#if previewUrl || pendingFiles.length > 0}
      <div class="preview-bar">
        {#if previewUrl}
          <div class="preview-card">
            <img src={previewUrl} alt="Paste preview" />
            <button
              type="button"
              class="remove-preview"
              onclick={removeAttachment}
              title="Remove image"
            >
              <Icon name="close" size={14} color="white" />
            </button>
          </div>
        {/if}

        {#each pendingFiles as file, i (i + '-' + file.name + '-' + file.size)}
          <div class="file-chip" title={file.name}>
            <div class="file-chip-icon">
              <Icon name="file" size={14} strokeWidth={1.8} />
            </div>
            <div class="file-chip-meta">
              <span class="file-chip-name">{file.name}</span>
              <span class="file-chip-size">{formatFileSize(file.size)}</span>
            </div>
            <button
              type="button"
              class="remove-preview file-chip-remove"
              onclick={() => removePendingFile(i)}
              title="Remove file"
              aria-label="Remove file"
            >
              <Icon name="close" size={12} color="white" />
            </button>
          </div>
        {/each}
      </div>
    {/if}

    <div class="input-area">
      {#if onAttachFiles}
        <button
          class="secondary-button attach-button"
          type="button"
          onclick={handleAttachClick}
          disabled={!selectedContent}
          aria-label="Attach file"
          title="Attach file"
        >
          <Icon name="paperclip" size={16} strokeWidth={2} color="#f47e3a" />
        </button>
        <input
          bind:this={fileInputRef}
          type="file"
          multiple
          hidden
          onchange={handleAttachChange}
        />
      {/if}

      <textarea
        bind:this={inputRef}
        bind:value={messageInput}
        placeholder="Type a message..."
        disabled={!selectedContent}
        onpaste={handlePaste}
        onkeydown={handleKeydown}
        rows="1"
      ></textarea>

      <div class="emoji-wrapper" use:clickOutside={() => (showGifPicker = false)}>
        <div class="picker-container" class:visible={showGifPicker}>
          {#if showGifPicker}
            <GifPicker onSelect={setGifAttachment} />
          {/if}
        </div>
        <button
          class="secondary-button gif-button"
          type="button"
          onclick={() => (showGifPicker = !showGifPicker)}
          aria-label="Insert GIF"
          title="Insert GIF"
        >
          GIF
        </button>
      </div>

      <div class="emoji-wrapper" use:clickOutside={() => (showPicker = false)}>
        <div class="picker-container" class:visible={showPicker} use:emojiPicker></div>
        <button class="secondary-button" type="button" onclick={() => (showPicker = !showPicker)}>
          😊
        </button>
      </div>

      <button
        class="sendbut"
        type="submit"
        disabled={!selectedContent ||
          (!messageInput.trim() && !attachedFile && !attachedGifUrl && pendingFiles.length === 0)}
        aria-label="Send"
        title="Send"
      >
        <Icon name="send" size={18} color="white" />
      </button>
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

  .attach-button {
    width: 38px;
    height: 38px;
  }

  .input-container {
    display: flex;
    flex-direction: column;
  }

  .preview-bar {
    padding: 12px 18px 0 18px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .file-chip {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    padding: 0 28px 0 8px;
    background: #ffffff;
    border: 1px solid #e4cbb2;
    border-radius: 10px;
    max-width: 240px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .file-chip-icon {
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    border-radius: 7px;
    background: rgba(255, 132, 60, 0.12);
    color: #ff843c;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .file-chip-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.1;
  }

  .file-chip-name {
    font-size: 12px;
    font-weight: 600;
    color: #2a2a2a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
  }

  .file-chip-size {
    font-size: 10px;
    color: #aaa;
  }

  .file-chip-remove {
    top: 50%;
    right: 4px;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
  }

  .file-chip-remove:hover {
    transform: translateY(-50%);
  }

  .preview-card {
    position: relative;
    width: 64px;
    height: 64px;
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid #ff843c;
    background: #f9f9f9;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .preview-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .remove-preview {
    position: absolute;
    top: 2px;
    right: 2px;
    background: rgba(0, 0, 0, 0.6);
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    padding: 0;
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .remove-preview:hover {
    background: rgba(255, 0, 0, 0.7);
  }

  .input-area {
    display: flex;
    align-items: center;
    padding: 14px 18px;
    gap: 8px;
  }

  .input-area textarea {
    flex: 1;
    padding: 11px 16px;
    background-color: #ffffff;
    border: 1px solid #e4cbb2;
    border-radius: 20px;
    color: #1d2021;
    font: inherit;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
    resize: none;
    overflow-y: auto;
    max-height: 120px;
    field-sizing: content;
  }

  .input-area textarea:focus {
    border-color: #ff843c;
  }

  .input-area textarea::placeholder {
    color: #c4a98a;
  }

  .secondary-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 999px;
    background-color: #ffffff;
    border: 1px solid #e4cbb2;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
    transition: background-color 0.2s;
  }

  .secondary-button:hover {
    background-color: #fae0c8;
  }

  .emoji-wrapper .secondary-button {
    font-size: 20px;
  }

  .gif-button {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: #f47e3a;
  }

  .sendbut {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 999px;
    background-color: #ff843c;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
    transition:
      background-color 0.2s,
      transform 0.1s;
  }

  .sendbut:hover:not(:disabled) {
    background-color: #e56e2a;
  }

  .sendbut:active:not(:disabled) {
    transform: scale(0.93);
  }

  .sendbut:disabled {
    background-color: #f5c4a0;
    cursor: not-allowed;
  }

  .emoji-wrapper {
    position: relative;
  }

  .picker-container {
    display: none;
    position: absolute;
    bottom: 55px;
    right: 0;
    z-index: 100;
  }

  .picker-container.visible {
    display: block;
  }
</style>
