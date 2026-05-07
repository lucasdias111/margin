<script lang="ts">
  import AppModal from '$src/components/common/modals/AppModal.svelte'
  import Button from '$src/components/common/buttons/Button.svelte'
  import { type LimitType, upgradeState } from '$src/states/UpgradeState.svelte'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { sessionState } from '$src/states/SessionState.svelte'
  import { MarginRole } from '$src/interfaces/Margin'
  import { navigationService } from '$src/services/NavigationService'
  import { View } from '$src/interfaces/View'

  const currentUserRole = $derived(
    navigationState.selectedMargin?.members.find((m) => m.user.id === sessionState.currentUser?.id)
      ?.role
  )
  const canUpgrade = $derived(
    currentUserRole === MarginRole.OWNER || currentUserRole === MarginRole.ADMIN
  )

  const limitCopy: Record<LimitType, string> = {
    MEMBERS: 'add more members to this workspace',
    STORAGE: 'upload more files',
    CALL_PARTICIPANTS: 'fit more people in this call'
  }

  const limitText = $derived(
    upgradeState.limit ? `to ${limitCopy[upgradeState.limit]}` : 'to do that'
  )

  function handleClose(): void {
    upgradeState.close()
  }

  function handleUpgrade(): void {
    navigationState.manageTab = 'Subscription'
    navigationService.setView(View.Manage)
    upgradeState.close()
  }
</script>

<AppModal open={upgradeState.open} title="Upgrade required" onClose={handleClose}>
  <p class="lead">
    Your <strong>{upgradeState.tier ?? 'current'}</strong> plan doesn't allow you {limitText}.
  </p>
  {#if upgradeState.message}
    <p class="detail">{upgradeState.message}</p>
  {/if}

  <div class="actions">
    {#if canUpgrade}
      <Button buttonType="secondary" size="medium" text="Not now" onClick={handleClose} />
      <Button buttonType="primary" size="medium" text="Upgrade plan" onClick={handleUpgrade} />
    {:else}
      <p class="hint">Ask a workspace admin to upgrade.</p>
      <Button buttonType="primary" size="medium" text="Got it" onClick={handleClose} />
    {/if}
  </div>
</AppModal>

<style>
  .lead {
    margin: 0 0 8px 0;
    color: #2d2d2d;
  }
  .detail {
    margin: 0 0 16px 0;
    color: #666;
    font-size: 0.9rem;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    align-items: center;
  }
  .hint {
    flex: 1;
    margin: 0;
    color: #888;
    font-size: 0.9rem;
  }
</style>
