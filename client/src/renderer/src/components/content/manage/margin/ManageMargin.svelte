<script lang="ts">
  import { onMount } from 'svelte'
  import { type Margin, type MarginMember, type UpdateMargin } from '$src/interfaces/Margin'
  import ManageMarginInformation from '$src/components/content/manage/margin/ManageMarginInformation.svelte'
  import ManageMarginMembers from '$src/components/content/manage/margin/ManageMarginMembers.svelte'
  import { marginService } from '$src/services/MarginService'
  import type { User } from '$src/interfaces/User'
  import { marginInviteService } from '$src/services/MarginInviteService'
  import ConfirmationModal from '$src/components/common/modals/ConfirmationModal.svelte'
  import { navigationState } from '$src/states/NavigationState.svelte'

  let margin = $state<Margin | null>(null)
  let isLoading = $state(true)
  let memberToRemove = $state<MarginMember | null>(null)

  onMount(async () => {
    try {
      margin = await marginService.getMargin(navigationState.selectedMargin.marginId)
    } catch (e) {
      console.error('Failed to load margin:', e)
    } finally {
      isLoading = false
    }
  })

  async function onSaveInfo(updated: UpdateMargin): Promise<void> {
    try {
      margin = await marginService.updateMargin(updated)
      marginService.updateMarginDetails(
        margin.marginId,
        margin.marginName,
        margin.marginDescription,
        margin.marginIconUrl
      )
    } catch (e) {
      console.error('Failed to update margin:', e)
    }
  }

  async function onDeleteMargin(): Promise<void> {
    try {
      await marginService.deleteMargin(margin)
    } catch (e) {
      console.error('Failed to delete margin:', e)
    }
  }

  async function onInviteUser(user: User): Promise<void> {
    try {
      await marginInviteService.sendDirectInvite(margin.marginId, user.handle)
    } catch (e) {
      console.error('Failed to send invite:', e)
      throw e
    }
  }

  async function onUpdateMemberRole(member: MarginMember): Promise<void> {
    try {
      const updated = await marginService.updateMarginMemberRole(margin.marginId, member)
      margin = {
        ...margin,
        members: margin.members.map((m) => (m.user.id === updated.user.id ? updated : m))
      }
    } catch (e) {
      console.error('Failed to update member role:', e)
    }
  }

  async function onRemoveMember(member: MarginMember): Promise<void> {
    try {
      await marginService.removeMarginMember(margin.marginId, member.user.id)
      margin = {
        ...margin,
        members: margin.members.filter((m) => m.user.id !== member.user.id)
      }
    } catch (e) {
      console.error('Failed to remove member:', e)
    }
  }

  async function confirmRemoveMember(): Promise<void> {
    if (!memberToRemove) return
    await onRemoveMember(memberToRemove)
    memberToRemove = null
  }
</script>

<div class="manage-margin-window">
  {#if isLoading}
    <div class="loading">Loading margin...</div>
  {:else if margin}
    <ManageMarginInformation {margin} {onSaveInfo} {onDeleteMargin} />
    <ManageMarginMembers
      {margin}
      {onInviteUser}
      {onUpdateMemberRole}
      onRemoveMember={(member) => (memberToRemove = member)}
    />

    <ConfirmationModal
      open={memberToRemove !== null}
      title="Remove member"
      message="Are you sure you want to remove {memberToRemove?.user.displayName} from this margin? They will lose access to all spaces and channels."
      confirmLabel="Remove"
      variant="delete"
      onConfirm={confirmRemoveMember}
      onClose={() => (memberToRemove = null)}
    />
  {/if}
</div>

<style>
  .manage-margin-window {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #888;
    font-size: 0.95rem;
  }
</style>
