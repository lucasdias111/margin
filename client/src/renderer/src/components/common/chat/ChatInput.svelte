<script lang="ts">
  import { Picker } from 'emoji-mart'
  import data from '@emoji-mart/data'
  import { clickOutside } from '$src/actions/clickOutside'
  import { replaceEmoticons } from '$src/utils/EmoticonUtils'

  let {
    selectedContent,
    messageInput = $bindable(''),
    onSubmit
  }: {
    selectedContent: boolean
    messageInput: string
    onSubmit: (event: SubmitEvent) => void
  } = $props()

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === ' ') {
      messageInput = replaceEmoticons(messageInput)
    }
  }

  let showPicker = $state(false)

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
    <input
      bind:value={messageInput}
      placeholder="Type a message..."
      disabled={!selectedContent}
      onkeydown={handleKeydown}
    />
    <button class="secondary-button" type="submit" aria-label="Attach file(s)">
      <svg
        fill="#f47e3a"
        height="18px"
        width="18px"
        viewBox="0 0 511.36 511.36"
        transform="rotate(-45)"
      >
        <path
          d="M454.827,35.2c-46.933-46.933-122.027-46.933-168.96,0
            L63.147,258.773c-3.413,3.413-3.413,8.533,0,11.947 s8.533,
            3.413,11.947,0l222.72-223.573c40.107-40.107,
            104.96-40.107,145.067,0c40.107,40.107,40.107,104.96,0,145.067
            L162.133,472.96c-28.16,28.16-74.24,28.16-102.4,0c-28.16-28.16-28.16-74.24,0-102.4l226.133-226.987
            c17.067-16.213,43.52-17.067,60.587,0c16.213,17.067,16.213,44.373,0,60.587l-168.96,169.813c-3.413,
            3.413-3.413,8.533,0,11.947 c3.413,3.413,8.533,3.413,11.947,0L358.4,216.96c23.04-23.04,23.04-61.44,
            0-84.48c-23.04-23.04-61.44-23.04-84.48,0 L47.787,358.613c-34.987,34.133-34.987,91.307,
            0,126.293c17.067,17.92,40.107,26.453,63.147,26.453 c23.04,0,46.08-8.533,63.147-26.453L454.827,
            204.16c22.187-22.187,34.987-52.907,34.987-84.48 C489.813,88.107,477.013,57.387,454.827,35.2z"
        /></svg
      >
    </button>
    <div class="emoji-wrapper" use:clickOutside={() => (showPicker = false)}>
      <div class="picker-container" class:visible={showPicker} use:emojiPicker></div>
      <button class="secondary-button" type="button" onclick={() => (showPicker = !showPicker)}
        >😊</button
      >
    </div>
    <button
      class="sendbut"
      type="submit"
      disabled={!selectedContent}
      aria-label="Send"
      title="Send"
    >
      <svg
        width="18"
        height="18"
        viewBox="568 254 32 33"
        fill="white"
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          d="M584,283
           C584,283 580.872,276.976 580,275
           L596.075,259.779
           L584,283 Z
           M572,270
           L595,259
           L579,274
           L572,270 Z
           M599,255
           C597.844,255.563 568,270 568,270
           C568,270 578.052,276.059 578,276
           C577.983,275.981 584,287 584,287
           C584,287 599.75,256.5 600,256
           C600.219,255.375 599.75,254.688 599,255 Z"
        />
      </svg>
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

  .input-area input {
    flex: 1;
    padding: 11px 16px;
    background-color: #ffffff;
    border: 1px solid #e4cbb2;
    border-radius: 999px;
    color: #1d2021;
    font: inherit;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }

  .input-area input:focus {
    border-color: #f47e3a;
  }

  .input-area input::placeholder {
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
