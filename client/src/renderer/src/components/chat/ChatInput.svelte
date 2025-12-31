<script lang="ts">
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

<div>
  <form class="input-area" onsubmit={onSubmit}>
    <input bind:value={messageInput} placeholder="Type a message..." disabled={!selectedContent} />
    <button type="submit" disabled={!selectedContent}>Send</button>
  </form>
</div>

<style>
  .input-area {
    display: flex;
    padding: 20px;
    gap: 10px;
    border-top: 1px solid #333;
  }

  .input-area input {
    flex: 1;
    padding: 10px;
    background-color: #2a2a2a;
    border: 1px solid #333;
    border-radius: 4px;
    color: #f6f6f6;
  }

  .input-area button {
    padding: 10px 20px;
  }
</style>
