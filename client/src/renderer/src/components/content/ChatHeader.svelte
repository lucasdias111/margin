<script lang="ts">
  import voiceCallIcon from '$src/resources/voiceCall.png'
  import videoCallIcon from '$src/resources/videoCall.png'
  import hangUpCallIcon from '$src/resources/hangUpCall.png'

  interface Props {
    name: string
    handleStartCall(): void
    handleStartVideoCall(): void
    isInCall?: boolean
  }

  let { name, handleStartVideoCall, handleStartCall, isInCall = false }: Props = $props()
</script>

<div>
  <div class="chat-header">
    <h1 class="username">{name}</h1>
    <div class="call-buttons">
      <button
        class="call-btn"
        class:active-call={isInCall}
        onclick={handleStartCall}
        title={isInCall ? 'Leave voice call' : 'Voice call'}
      >
        {#if isInCall}
          <img src={hangUpCallIcon} alt="Hang up call" />
        {:else}
          <img src={voiceCallIcon} alt="Voice call" />
        {/if}
      </button>
      <button class="call-btn" onclick={handleStartVideoCall} title="Video call">
        <img src={videoCallIcon} alt="Video call" />
      </button>
    </div>
  </div>
</div>

<style>
  .chat-header {
    height: 80px;
    background-color: #2d2d2d;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    border-bottom: none;
    border-radius: 15px;
  }

  h1 {
    margin: 0;
    font-size: 20px;
  }

  .username {
    color: #da6b10;
  }

  .call-buttons {
    display: flex;
    gap: 12px;
    
  }

  .call-btn {
    background: #da6b10;
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

  .call-btn.active-call {
    background-color: #dc3545;
  }

  .call-btn.active-call:hover {
    background-color: #c82333;
  }

  .call-btn img {
    width: 24px;
    height: 24px;
    display: block;
  }
</style>
