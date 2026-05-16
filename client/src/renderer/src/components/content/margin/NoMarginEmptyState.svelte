<script lang="ts">
  import CreateMarginModal from '$src/components/content/manage/margin/modals/CreateMarginModal.svelte'
  import type { CreateMargin } from '$src/interfaces/Margin'
  import { marginService } from '$src/services/MarginService'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { marginInviteService } from '$src/services/MarginInviteService'
  import Button from '$src/components/common/buttons/Button.svelte'

  let modalOpen = $state(false)
  let joinCode = $state('')
  let joinLoading = $state(false)
  let joinError = $state<string | null>(null)

  async function onCreate(createRequest: CreateMargin): Promise<void> {
    await marginService.createMargin(createRequest)
    modalOpen = false
  }

  async function handleJoinWithCode(): Promise<void> {
    if (!joinCode.trim()) return
    joinLoading = true
    joinError = null
    try {
      const margin = await marginInviteService.acceptLinkInvite(joinCode.trim())
      marginService.addNewMargin(margin)
      joinCode = ''
    } catch (e) {
      joinError = 'Invalid or expired code'
    } finally {
      joinLoading = false
    }
  }
</script>

<div class="empty-state">
  <div class="icon">
    <Icon name="layout" size={48} strokeWidth={1.5} color="#d9d9d9" />
  </div>
  <h2>No margin yet</h2>
  <p>Create a margin to get started with spaces, channels, and team communication.</p>
  <div data-tour="margin-empty-create">
    <Button
      buttonType="primary"
      size="medium"
      text="Create margin"
      onClick={() => (modalOpen = true)}
    />
  </div>

  <div class="divider">
    <span>or</span>
  </div>

  <div class="join-section">
    <span class="join-label">Join with invite code</span>
    <div class="join-row">
      <input
        class="join-input"
        type="text"
        placeholder="Paste code"
        bind:value={joinCode}
        maxlength="36"
        onkeydown={(e) => {
          if (e.key === 'Enter') handleJoinWithCode()
        }}
      />
      <Button
        buttonType="primary"
        size="small"
        onClick={handleJoinWithCode}
        text="Join"
        disabled={joinLoading || !joinCode.trim()}
      />
    </div>
    {#if joinError}
      <span class="join-error">{joinError}</span>
    {/if}
  </div>
</div>

<CreateMarginModal open={modalOpen} onClose={() => (modalOpen = false)} {onCreate} />

<style>
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #ffffff;
    text-align: center;
    padding: 40px;
  }

  .icon {
    margin-bottom: 8px;
  }

  h2 {
    font-size: 1.2rem;
    font-weight: 600;
    margin: 0;
    color: #2d2d2d;
  }

  p {
    font-size: 0.9rem;
    color: #888;
    margin: 0;
    max-width: 280px;
    line-height: 1.5;
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #c4bfb8;
    font-size: 12px;
    width: 240px;
    margin-top: 4px;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #ece8e0;
  }

  .join-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .join-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #888;
  }

  .join-row {
    display: flex;
    gap: 6px;
  }

  .join-input {
    padding: 4px 8px;
    border-radius: 8px;
    border: 1px solid #ece8e0;
    background: #fafafa;
    font-family: monospace;
    font-size: 13px;
    color: #2a2a2a;
    outline: none;
    width: 180px;
  }

  .join-input:focus {
    border-color: #ff843c;
    background: white;
  }

  .join-error {
    font-size: 11px;
    color: #c0392b;
  }
</style>
