<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte'
  import marginLogo from '$src/assets/pics/margin.png'
</script>

<div class="margin-home">
  <div class="welcome-card">
    <div class="welcome-top">
      <div class="logo-mark">
        <img src=".{marginLogo}" alt="Margin Logo" class="logo" />
      </div>
      <button class="manage-btn" onclick={() => (chatState.currentlySelectedContent = 'manage')}>
        Manage Margin
      </button>
    </div>
  </div>

  <div class="dashboard-grid">
    <div class="dash-card dash-card--full">
      <div class="card-header">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span class="card-title">Online now</span>
      </div>
      <div class="card-empty">No members loaded</div>
    </div>

    <div class="dash-card dash-card--full">
      <div class="card-header">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <line x1="12" y1="17" x2="12" y2="22" />
          <path
            d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"
          />
        </svg>
        <span class="card-title">Pinned</span>
      </div>
      <div class="card-empty">No pinned messages</div>
    </div>
  </div>
</div>

<style>
  .margin-home {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 24px;
    overflow-y: auto;
    background: white;
    border-radius: 15px;
    min-height: 0;
  }

  .logo {
    width: 50%;
  }

  .margin-home::-webkit-scrollbar {
    width: 4px;
  }
  .margin-home::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.08);
    border-radius: 4px;
  }

  .welcome-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .welcome-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo-mark {
    line-height: 1;
  }

  .manage-btn {
    padding: 7px 14px;
    background-color: #f47e3a;
    border: none;
    border-radius: 10px;
    color: #fff;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.15s;
    white-space: nowrap;
  }

  .manage-btn:hover {
    background-color: #e19a5d;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .dash-card--full {
    grid-column: 1 / -1;
  }

  .dash-card {
    background: #f7f7fa;
    border-radius: 12px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #aaa;
  }

  .card-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #aaa;
  }

  .card-empty {
    font-size: 13px;
    color: #ccc;
  }
</style>
