<script lang="ts">
  import { Picker } from 'emoji-mart'
  import data from '@emoji-mart/data'
  import { clickOutside } from '$src/actions/clickOutside'
  import { replaceEmoticons } from '$src/utils/EmoticonUtils'
  import Icon from '$src/components/common/icons/Icon.svelte'

  let {
    selectedContent,
    messageInput = $bindable(''),
    onSubmit
  }: {
    selectedContent: boolean
    messageInput: string
    onSubmit: (event: SubmitEvent) => void
  } = $props()

  let showPicker = $state(false)
  let inputRef = $state<HTMLTextAreaElement | null>(null)

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === ' ') {
      messageInput = replaceEmoticons(messageInput)
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      inputRef?.form?.requestSubmit()
    }
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
  <form class="input-area" onsubmit={onSubmit}>
    <textarea
      bind:this={inputRef}
      bind:value={messageInput}
      placeholder="Type a message..."
      disabled={!selectedContent}
      onkeydown={handleKeydown}
      rows="1"
    ></textarea>
    <div class="emoji-wrapper" use:clickOutside={() => (showPicker = false)}>
      <div class="picker-container" class:visible={showPicker} use:emojiPicker></div>
      <button class="secondary-button" type="button" onclick={() => (showPicker = !showPicker)}
        >😊
      </button>
    </div>
    <button
      class="sendbut"
      type="submit"
      disabled={!selectedContent}
      aria-label="Send"
      title="Send"
    >
      <Icon name="send" size={18} color="white" />
    </button>
  </form>
</div>

<style>
  .chat-page {
    flex-shrink: 0;
    background-color: white;
    border-radius: 20px;
    outline: none;
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
    border-color: #f47e3a;
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

  .secondary-button:active {
    background-color: #f5caa8;
  }

  .emoji-wrapper .secondary-button {
    font-size: 20px;
    line-height: 1;
  }

  .sendbut {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 999px;
    background-color: #f47e3a;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
    transition:
      background-color 0.2s,
      transform 0.1s;
  }

  .sendbut:hover {
    background-color: #e56e2a;
  }

  .sendbut:active {
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
    bottom: 50px;
    right: 0;
    z-index: 100;
  }

  .picker-container.visible {
    display: block;
  }
</style>
