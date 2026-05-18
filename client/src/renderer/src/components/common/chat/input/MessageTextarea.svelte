<script lang="ts">
  import { replaceEmoticons } from '$src/utils/EmoticonUtils'
  import { compressImage } from '$src/utils/ImageUtils'

  let {
    value = $bindable(''),
    disabled,
    allowFileAttachments,
    onImagePasted
  }: {
    value: string
    disabled: boolean
    allowFileAttachments: boolean
    onImagePasted: (file: File) => void
  } = $props()

  let inputRef: HTMLTextAreaElement

  export function focus(): void {
    inputRef?.focus()
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === ' ') {
      value = replaceEmoticons(value)
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      inputRef?.form?.requestSubmit()
    }
  }

  async function handlePaste(e: ClipboardEvent): Promise<void> {
    if (!allowFileAttachments) return
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          e.preventDefault()
          const compressed = await compressImage(file)
          onImagePasted(compressed)
        }
      }
    }
  }
</script>

<textarea
  bind:this={inputRef}
  bind:value
  placeholder="Type a message..."
  {disabled}
  onpaste={handlePaste}
  onkeydown={handleKeydown}
  rows="1"
></textarea>

<style>
  textarea {
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

  textarea:focus {
    border-color: #ff843c;
  }

  textarea::placeholder {
    color: #c4a98a;
  }
</style>