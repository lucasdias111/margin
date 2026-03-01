<script lang="ts">
  import AttIcon from '$src/components/svg/AttachIcon.svelte'
  import SendIcon from '$src/components/svg/SendIcon.svelte'

  let {
    selectedContent,
    messageInput = $bindable(''),
    onSubmit
  }: {
    selectedContent: boolean
    messageInput: string
    onSubmit: (event: SubmitEvent) => void
  } = $props()
</script>

<div class="chat-page">
  <form class="input-area" onsubmit={onSubmit}>
    <input bind:value={messageInput} placeholder="Type a message..." disabled={!selectedContent} />
    <button class="attachbut" type="submit" aria-label="Attach file(s)" >
      <AttIcon />
    </button>
    <button
      class="sendbut"
      type="submit"
      disabled={!selectedContent}
      aria-label="Send"
      title="Send"
    >
      <SendIcon />
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

  .sendbut {
    background-color: #f47e3a;
    display: flex;
    border-radius: 20px;
    border: none;
    cursor: pointer;
  }

  .attachbut {
    display: flex;
    border-radius: 20px;
    background-color: #2d2d2d;
  }

  .input-area {
    display: flex;
    padding: 20px;
    gap: 10px;
  }

  .input-area input {
    display: flex;
    flex: 1;
    padding: 10px;
    background-color: white;
    border: 1px solid rgb(206, 206, 206);
    border-radius: 15px;
    color: #1d2021;
  }

  .input-area button {
    padding: 10px 20px;
  }
</style>
