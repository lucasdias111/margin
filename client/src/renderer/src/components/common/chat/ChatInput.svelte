<script lang="ts">
  import { Picker } from 'emoji-mart'
  import data from '@emoji-mart/data'
  import { clickOutside } from '$src/actions/clickOutside'
  import { replaceEmoticons } from '$src/utils/EmoticonUtils'
  import { compressImage } from '$src/utils/ImageUtils'
  import Icon from '$src/components/common/icons/Icon.svelte'

  let {
    selectedContent,
    messageInput = $bindable(''),
    onSubmit
  }: {
    selectedContent: boolean
    messageInput: string
    onSubmit: (event: SubmitEvent, file: File | null) => void
  } = $props()

  let showPicker = $state(false)
  let inputRef = $state<HTMLTextAreaElement | null>(null)
  let attachedFile = $state<File | null>(null)
  let previewUrl = $state<string | null>(null)

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
    if (previewUrl) URL.revokeObjectURL(previewUrl)

    attachedFile = file
    previewUrl = URL.createObjectURL(file)
  }

  function removeAttachment(): void {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    attachedFile = null
    previewUrl = null
  }

  function handleFormSubmit(e: SubmitEvent): void {
    e.preventDefault()
    onSubmit(e, attachedFile)

    messageInput = ''
    removeAttachment()
  }

  export function focus(): void {
    inputRef?.focus()
  }

  function emojiPicker(node: HTMLElement): { destroy(): void } {
    const picker = new Picker({
      data,
      onEmojiSelect: (emoji: any) => {
        messageInput += emoji.native
        showPicker = false
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

<div class="chat-page">
  <form class="input-container" onsubmit={handleFormSubmit}>
    {#if previewUrl}
      <div class="preview-bar">
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
      </div>
    {/if}

    <div class="input-area">
      <textarea
        bind:this={inputRef}
        bind:value={messageInput}
        placeholder="Type a message..."
        disabled={!selectedContent}
        onpaste={handlePaste}
        onkeydown={handleKeydown}
        rows="1"
      ></textarea>

      <div class="emoji-wrapper" use:clickOutside={() => (showPicker = false)}>
        <div class="picker-container" class:visible={showPicker} use:emojiPicker></div>
        <button class="secondary-button" type="button" onclick={() => (showPicker = !showPicker)}>
          😊
        </button>
      </div>

      <button
        class="sendbut"
        type="submit"
        disabled={!selectedContent || (!messageInput.trim() && !attachedFile)}
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
    flex-shrink: 0;
    background-color: white;
    border-radius: 20px;
    outline: none;
    border: 1px solid #e4cbb2;
  }

  .input-container {
    display: flex;
    flex-direction: column;
  }

  .preview-bar {
    padding: 12px 18px 0 18px;
    display: flex;
    gap: 8px;
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
