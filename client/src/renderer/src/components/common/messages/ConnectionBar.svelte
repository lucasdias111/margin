<script lang="ts">
  import { webSocketService } from '$src/services/WebSocketService'
  import { connectionState } from '$src/states/ConnectionState.svelte'
</script>

{#if connectionState.connectionStatus === 'reconnecting'}
  <div class="connection-banner">Reconnecting to server...</div>
{:else if connectionState.connectionStatus === 'disconnected'}
  <div class="connection-banner">
    Connection lost.
    <button onclick={() => webSocketService.connect()}>Retry</button>
  </div>
{/if}

<style>
  .connection-banner {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1100;
    padding: 8px 16px;
    text-align: center;
    font-size: 13px;
    font-weight: 500;
    background-color: #e8712a;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .connection-banner button {
    background: white;
    color: #e8712a;
    border: none;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
</style>
