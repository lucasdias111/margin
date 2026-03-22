<script lang="ts">
  import CreateMarginModal from '$src/components/content/manage/margin/modals/CreateMarginModal.svelte'
  import type { CreateMargin } from '$src/interfaces/Margin'
  import { marginService } from '$src/services/MarginService'
  import { chatState } from '$src/states/ChatState.svelte'

  let modalOpen = $state(false)

  async function onCreate(createRequest: CreateMargin): Promise<void> {
    const newMargin = await marginService.createMargin(createRequest)
    chatState.selectMargin(newMargin)
    marginService.addNewMargin(newMargin)
    modalOpen = false
  }
</script>

<div class="empty-state">
  <div class="icon">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d9d9d9" stroke-width="1.5">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  </div>
  <h2>No margin yet</h2>
  <p>Create a margin to get started with spaces, channels, and team communication.</p>
  <button class="create-btn" onclick={() => (modalOpen = true)}>Create margin</button>
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

  .create-btn {
    margin-top: 8px;
    background: #ff6203;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 10px 24px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
  }

  .create-btn:hover {
    background: #e55700;
  }
</style>
