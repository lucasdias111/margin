<script lang="ts">
  import type { Channel } from '$src/interfaces/Channel'
  import type { User } from '$src/interfaces/User'
  import { channelCallService } from '$src/services/call/ChannelCallService'
  import { callState } from '$src/states/CallState.svelte.js'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { sessionState } from '$src/states/SessionState.svelte'
  import { usersState } from '$src/states/UsersState.svelte'
  import { fileStorageService } from '$src/services/FileStorageService'
  import type { StoredFile } from '$src/interfaces/StoredFile'
  import FileRow from '$src/components/common/files/FileRow.svelte'

  let {
    channel,
    isOpen = $bindable(false)
  }: {
    channel: Channel | null
    isOpen: boolean
  } = $props()

  let isInChannelCall = $derived(
    callState.isGroupCall && callState.groupCallState?.channelId === channel.id
  )
  let voiceParticipants = $derived<User[]>(
    (channel?.voiceParticipants ?? [])
      .map((p) => usersState.byId.get(p.id))
      .filter((u): u is User => u !== undefined)
  )
  let spaceMembers = $derived<User[]>(
    (navigationState.selectedSpace?.members ?? [])
      .map((member) => usersState.byId.get(member.user.id))
      .filter((u) => u !== undefined)
  )

  let channelFiles = $state<StoredFile[]>([])
  let activeTab = $state<'voice' | 'files'>('voice')

  $effect(() => {
    const channelId = channel?.id
    if (!channelId) {
      channelFiles = []
      return
    }
    fileStorageService.getChannelFiles(channelId).then((result) => {
      channelFiles = result
    })
  })

  function onJoinChannel(): void {
    if (isInChannelCall) {
      channelCallService.endChannelCall()
    } else {
      channelCallService.joinVoiceChannel(channel.id)
    }
  }

  function onLeaveChannel(): void {
    channelCallService.endChannelCall()
  }

  async function handleDownloadFile(file: StoredFile): Promise<void> {
    await fileStorageService.downloadFile(file.fileId)
  }

  async function handleDeleteFile(file: StoredFile): Promise<void> {
    await fileStorageService.deleteFile(file.fileId)
    channelFiles = channelFiles.filter((f) => f.fileId !== file.fileId)
  }

  async function handleRenameFile(file: StoredFile, newName: string): Promise<void> {
    const updated = await fileStorageService.renameFile(file.fileId, newName)
    if (updated) {
      channelFiles = channelFiles.map((f) => (f.fileId === updated.fileId ? updated : f))
    }
  }

  function canDeleteFile(file: StoredFile): boolean {
    return file.uploadedBy.id === sessionState.currentUser?.id
  }

  function canRenameFile(file: StoredFile): boolean {
    return file.uploadedBy.id === sessionState.currentUser?.id
  }

  let fileInput: HTMLInputElement
  let isUploading = $state(false)

  async function handleUploadClick(): Promise<void> {
    fileInput.click()
  }

  async function handleFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file || !channel?.id) return
    isUploading = true
    const uploaded = await fileStorageService.uploadChannelFile(channel.id, file)
    if (uploaded) {
      channelFiles = [uploaded, ...channelFiles]
    }
    isUploading = false
    input.value = ''
  }
</script>

<aside class="sidebar" class:closed={!isOpen || !channel}>
  <div class="tab-bar">
    <button
      class="tab-btn"
      class:active={activeTab === 'voice'}
      onclick={() => (activeTab = 'voice')}
    >
      <Icon name="mic" size={11} strokeWidth={2.2} />
      Voice
    </button>
    <button
      class="tab-btn"
      class:active={activeTab === 'files'}
      onclick={() => (activeTab = 'files')}
    >
      <Icon name="file" size={11} strokeWidth={2.2} />
      Files
      {#if channelFiles.length > 0}
        <span class="tab-badge">{channelFiles.length}</span>
      {/if}
    </button>
    <button class="close-btn" onclick={() => (isOpen = false)} aria-label="Close sidebar">
      <Icon name="x" size={12} strokeWidth={1.8} />
    </button>
  </div>

  <div class="sidebar-scroll">
    {#if activeTab === 'voice'}
      <section class="sidebar-section voice-section">
        <div class="voice-status">
          <span class="live-dot" class:active={voiceParticipants.length > 0}></span>
          <span class="voice-status-text">
            {#if voiceParticipants.length === 0}
              No one in voice
            {:else if voiceParticipants.length === 1}
              1 person in voice
            {:else}
              {voiceParticipants.length} people in voice
            {/if}
          </span>
        </div>

        {#if voiceParticipants.length > 0}
          <div class="voice-participants">
            {#each voiceParticipants as participant (participant.id)}
              <div
                class="voice-participant"
                class:is-me={participant.id === sessionState.currentUser?.id}
              >
                <span class="voice-dot"></span>
                <p class="voice-participant-name">{participant.displayName}</p>
              </div>
            {/each}
          </div>
        {/if}

        {#if isInChannelCall}
          <button class="leave-voice-btn" onclick={onLeaveChannel}>Leave</button>
        {:else}
          <button class="join-voice-btn" onclick={onJoinChannel}>Join voice</button>
        {/if}
      </section>

      <section class="sidebar-section">
        <div class="section-header">
          <Icon name="users" size={12} strokeWidth={2.5} />
          <span class="section-title">Members</span>
        </div>
        <div class="members-empty">
          {#each spaceMembers ?? [] as member (member.id)}
            <div class="member-entry">
              <span class="presence-dot" class:online={member.isOnline}></span>
              <p class="member-entry-text" class:offline={!member.isOnline}>
                {member.displayName}
              </p>
            </div>
          {/each}
        </div>
      </section>
    {:else}
      <section class="sidebar-section">
        <input
          bind:this={fileInput}
          type="file"
          class="file-input-hidden"
          onchange={handleFileSelected}
        />
        <button class="upload-btn" onclick={handleUploadClick} disabled={isUploading}>
          {#if isUploading}
            <Icon name="loader" size={12} strokeWidth={2} />
            Uploading…
          {:else}
            <Icon name="upload" size={12} strokeWidth={2} />
            Upload file
          {/if}
        </button>
        {#if channelFiles.length === 0}
          <p class="files-empty">No files shared yet</p>
        {:else}
          <div class="files-list">
            {#each channelFiles as file (file.fileId)}
              <FileRow
                {file}
                compact
                canDelete={canDeleteFile(file)}
                canRename={canRenameFile(file)}
                onDownload={handleDownloadFile}
                onDelete={handleDeleteFile}
                onRename={handleRenameFile}
              />
            {/each}
          </div>
        {/if}
      </section>
    {/if}
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

  .close-btn {
    flex-shrink: 0;
    width: 32px;
    border: none;
    background: none;
    cursor: pointer;
    color: #bbb;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.12s;
    padding: 0;
    margin-right: 6px;
  }

  .close-btn:hover {
    color: #666;
  }

  .tab-bar {
    display: flex;
    border-bottom: 1px solid rgba(0, 0, 0, 0.07);
    background: white;
    flex-shrink: 0;
  }

  .tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 8px 0;
    border: none;
    background: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #bbb;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition:
      color 0.15s,
      border-color 0.15s;
  }

  .tab-btn.active {
    color: #555;
    border-bottom-color: #555;
  }

  .tab-btn:hover:not(.active) {
    color: #888;
  }

  .tab-badge {
    font-size: 10px;
    font-weight: 700;
    color: #ff843c;
    background: rgba(255, 132, 60, 0.12);
    border-radius: 999px;
    padding: 1px 6px;
    line-height: 1.4;
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
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .voice-status {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .voice-status-text {
    font-size: 12px;
    color: #999;
  }

  .live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #ccc;
    flex-shrink: 0;
    transition: background 0.2s;
  }

  .live-dot.active {
    background: #3dd68c;
    animation: pulse 2s infinite;
  }

  .presence-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #ccc;
    flex-shrink: 0;
  }

  .presence-dot.online {
    background: #3dd68c;
  }

  .member-entry-text.offline {
    color: #bbb;
  }

  .join-voice-btn {
    width: 100%;
    padding: 7px 0;
    background: #3dd68c;
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    color: white;
    cursor: pointer;
    font-family: inherit;
    transition: opacity 0.15s;
  }

  .join-voice-btn:hover {
    opacity: 0.88;
  }

  .leave-voice-btn {
    width: 100%;
    padding: 7px 0;
    background: rgba(0, 0, 0, 0.05);
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    color: #999;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;
  }

  .leave-voice-btn:hover {
    background: rgba(220, 60, 60, 0.08);
    color: #d94f4f;
  }

  .members-empty {
    padding: 4px 0;
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

  .file-input-hidden {
    display: none;
  }

  .upload-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 7px 0;
    background: rgba(0, 0, 0, 0.04);
    border: 1px dashed rgba(0, 0, 0, 0.13);
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    color: #888;
    cursor: pointer;
    font-family: inherit;
    transition:
      background 0.15s,
      border-color 0.15s,
      color 0.15s;
  }

  .upload-btn:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.07);
    border-color: rgba(0, 0, 0, 0.22);
    color: #555;
  }

  .upload-btn:disabled {
    cursor: default;
    opacity: 0.6;
  }

  .files-empty {
    margin: 0;
    padding: 2px 4px;
    font-size: 12px;
    color: #bbb;
  }

  .files-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .voice-participants {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 2px 0;
  }

  .voice-participant {
    display: flex;
    align-items: center;
    gap: 7px;
    padding-left: 4px;
  }

  .voice-participant.is-me .voice-participant-name {
    color: #3dd68c;
  }

  .voice-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #3dd68c;
    flex-shrink: 0;
    animation: pulse 2s infinite;
  }

  .voice-participant-name {
    margin: 0;
    font-size: 13px;
    color: #444;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }
</style>
