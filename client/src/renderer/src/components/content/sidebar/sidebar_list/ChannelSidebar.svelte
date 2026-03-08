<script lang="ts">
  import type { Channel } from '$src/interfaces/Channel'
  import { chatState } from '$src/states/ChatState.svelte.js'

  let {
    channel,
    isOpen = $bindable(false)
  }: {
    channel: Channel | null
    isOpen: boolean
  } = $props()
</script>

<aside class="sidebar" class:closed={!isOpen || !channel}>
  <div class="sidebar-header">
    <span class="sidebar-title">Channel info</span>
    <button class="close-btn" onclick={() => (isOpen = false)} aria-label="Close sidebar">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <line
          x1="1"
          y1="1"
          x2="11"
          y2="11"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        />
        <line
          x1="11"
          y1="1"
          x2="1"
          y2="11"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        />
      </svg>
    </button>
  </div>

  <div class="sidebar-scroll">
    <section class="sidebar-section voice-section">
      <div class="section-header voice-header">
        <span class="live-dot"></span>
        <span class="section-title">Voice</span>
      </div>
      <div class="voice-empty">
        <span class="voice-empty-text">No one in voice</span>
      </div>
      <button class="join-voice-btn"> Join voice channel →</button>
    </section>

    <section class="sidebar-section">
      <div class="section-header">
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
        <span class="section-title">Members</span>
      </div>
      <div class="members-empty">
        {#each chatState.selectedSpace.members as member (member.user.id)}
          <div class="member-entry">
            <span class="live-dot"></span>
            <p class="member-entry-text">{member.user.displayName}</p>
          </div>
        {/each}
      </div>
    </section>

    <section class="sidebar-section">
      <div class="section-header">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span class="section-title">Files</span>
      </div>
      <div class="files-empty">
        <span class="empty-text">No files shared yet</span>
      </div>
    </section>
  </div>
</aside>

<style>
  .sidebar {
    width: 220px;
    flex-shrink: 0;
    background: #f7f7fa;
    border-radius: 15px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition:
      width 0.25s ease,
      opacity 0.25s ease;
    opacity: 1;
  }

  .sidebar.closed {
    width: 0;
    opacity: 0;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 14px 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.07);
    flex-shrink: 0;
    background: white;
  }

  .sidebar-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #888;
  }

  .close-btn {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: none;
    background: none;
    cursor: pointer;
    color: #bbb;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background 0.12s,
      color 0.12s;
    padding: 0;
  }

  .close-btn:hover {
    background: rgba(0, 0, 0, 0.07);
    color: #666;
  }

  .sidebar-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .sidebar-scroll::-webkit-scrollbar {
    width: 3px;
  }

  .sidebar-scroll::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }

  .sidebar-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #aaa;
  }

  .section-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #aaa;
  }

  .voice-section {
    background: rgba(61, 214, 140, 0.05);
    border: 1px solid rgba(61, 214, 140, 0.12);
    border-radius: 10px;
    padding: 10px 12px;
  }

  .voice-header {
    margin-bottom: 4px;
  }

  .live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #3dd68c;
    flex-shrink: 0;
  }

  .voice-empty {
    padding: 4px 0 6px;
  }

  .voice-empty-text {
    font-size: 12px;
    color: #aaa;
  }

  .join-voice-btn {
    width: 100%;
    padding: 5px 0;
    background: rgba(61, 214, 140, 0.1);
    border: 1px solid rgba(61, 214, 140, 0.25);
    border-radius: 7px;
    font-size: 12px;
    font-weight: 600;
    color: #3dd68c;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;
  }

  .join-voice-btn:hover {
    background: rgba(61, 214, 140, 0.18);
  }

  .members-empty,
  .files-empty {
    padding: 4px 0;
  }

  .empty-text {
    font-size: 12px;
    color: #ccc;
  }

  .member-entry {
    display: flex;
    align-items: center;
    gap: 7px;
    color: #aaa;
    padding-left: 10px;
  }

  .member-entry-text {
    margin: 0;
    padding: 2px 3px;
    font-size: 14px;
  }
</style>
