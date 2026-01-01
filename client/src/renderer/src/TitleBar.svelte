<script lang="ts">
  export let title: string

  function minimize(): void {
    window.api?.minimizeWindow()
  }

  function maximize(): void {
    window.api?.maximizeWindow();
  }

  function close(): void {
    window.api?.closeWindow();
  }
</script>

<div class="titlebar">
  <div class="titlebar-drag">
    <span class="title">{title}</span>
  </div>
  <div class="window-controls">
    <button class="window-button minimize" on:click={minimize} title="Minimize">
      <svg width="10" height="10" viewBox="0 0 10 10">
        <path d="M0,5 L10,5" stroke="currentColor" stroke-width="1"/>
      </svg>
    </button>
    <button class="window-button maximize" on:click={maximize} title="Maximize">
      <svg width="10" height="10" viewBox="0 0 10 10">
        <path d="M0,0 L10,0 L10,10 L0,10 Z" stroke="currentColor" stroke-width="1" fill="none"/>
      </svg>
    </button>
    <button class="window-button close" on:click={close} title="Close">
      <svg width="10" height="10" viewBox="0 0 10 10">
        <path d="M0,0 L10,10 M10,0 L0,10" stroke="currentColor" stroke-width="1"/>
      </svg>
    </button>
  </div>
</div>

<style>
  .titlebar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 32px;
    background-color: #f0f0f0;
    border-bottom: 1px solid #d0d0d0;
    user-select: none;
  }

  .titlebar-drag {
    flex: 1;
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 12px;
    -webkit-app-region: drag;
  }

  .title {
    font-size: 13px;
    font-weight: 500;
    color: #333;
  }

  .window-controls {
    display: flex;
    height: 100%;
    -webkit-app-region: no-drag;
  }

  .window-button {
    all: unset;
    width: 46px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.15s;
  }

  .window-button:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .window-button:active {
    background-color: rgba(0, 0, 0, 0.1);
  }

  .window-button.close:hover {
    background-color: #e81123;
    color: white;
  }

  .window-button.close:active {
    background-color: #c50b1a;
  }

  .window-button svg {
    color: #333;
  }

  .window-button.close:hover svg {
    color: white;
  }

  @media (prefers-color-scheme: dark) {
    .titlebar {
      background-color: #2d2d2d;
      border-bottom-color: #1a1a1a;
    }

    .title {
      color: #e0e0e0;
    }

    .window-button:hover {
      background-color: rgba(255, 255, 255, 0.08);
    }

    .window-button:active {
      background-color: rgba(255, 255, 255, 0.12);
    }

    .window-button svg {
      color: #e0e0e0;
    }
  }
</style>