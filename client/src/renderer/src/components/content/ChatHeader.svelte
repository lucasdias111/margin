<script lang="ts">
  import voiceCallIcon from '$src/resources/voiceCall.png'
  import videoCallIcon from '$src/resources/videoCall.png'

  interface Props {
    name: string

    handleStartCall(): void

    handleStartVideoCall(): void
  }

  let { name, handleStartVideoCall, handleStartCall }: Props = $props()
</script>

<div>
  <div class="chat-header">
    <h1 class="username">{name}</h1>
    <div class="call-buttons">
      <button class="call-btn" onclick={handleStartCall} title="Voice call">
        <img src={voiceCallIcon} alt="Voice call" />
      </button>
      <button class="call-btn" onclick={handleStartVideoCall} title="Video call">
        <img src={videoCallIcon} alt="Video call" />
      </button>
    </div>
  </div>
</div>

<style>

  .chat-header {
    height: 60px;
    background-color: #1a1a1a;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    border-bottom: 1px solid #333;
  }

  h1 {
    margin: 0;
    font-size: 20px;
  }

  .username {
    color: #b47024;
  }

  .call-buttons {
    display: flex;
    gap: 12px;
  }

  .call-btn {
    background: #b47024;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }

  .call-btn:hover {
    background-color: #2a2a2a;
  }

  .call-btn:active {
    background-color: #3a3a3a;
  }

  .call-btn img {
    width: 24px;
    height: 24px;
    display: block;
  }
</style>
