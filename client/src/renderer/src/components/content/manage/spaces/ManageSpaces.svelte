<script lang="ts">
  import ManageSpaceInformation from '$src/components/content/manage/spaces/ManageSpaceInformation.svelte'
  import ManageSpaceMembers from '$src/components/content/manage/spaces/ManageSpaceMembers.svelte'
  import ManageSpacesList from '$src/components/content/manage/spaces/ManageSpacesList.svelte'
  import type { CreateSpace, Space, SpaceMember } from '$src/interfaces/Space'
  import { onMount } from 'svelte'
  import { spaceService } from '$src/services/SpaceService'
  import type { Channel, CreateChannel } from '$src/interfaces/Channel'
  import ConfirmationModal from '$src/components/common/modals/ConfirmationModal.svelte'
  import { navigationState } from '$src/states/NavigationState.svelte'

  let memberToRemove = $state<SpaceMember | null>(null)
  let spaces = $state<Space[]>([])
  let selectedSpace = $state<Space | null>(null)

  onMount(async () => {
    spaces = await spaceService.getAllSpacesForMargin(navigationState.selectedMargin.marginId)
  })

  function onSelectSpace(space: Space): void {
    selectedSpace = space
  }

  async function onAddSpace(space: CreateSpace): Promise<void> {
    let newSpace: Space
    newSpace = await spaceService.createSpace(space)
    if (!newSpace) return
    spaces = [...spaces, newSpace]
  }

  async function onAddMember(user: SpaceMember): Promise<void> {
    const newMember = await spaceService.addSpaceMemberToSpace(user)
    if (!newMember) return
    selectedSpace.members = [...selectedSpace.members, newMember]
  }

  async function onUpdateMemberRole(spaceMember: SpaceMember): Promise<void> {
    const updated = await spaceService.updateSpaceMemberRole(spaceMember)
    if (!updated) return
    selectedSpace.members = selectedSpace.members.map((m) =>
      m.user.id === updated.user.id ? updated : m
    )
  }

  async function onAddChannel(channel: CreateChannel): Promise<void> {
    const newChannel = await spaceService.createChannel(channel)
    if (!newChannel) return
    selectedSpace.channels = [...selectedSpace.channels, newChannel]
  }

  async function onSaveInfo(space: Space): Promise<void> {
    const updatedSpace = await spaceService.updateSpaceInfo(space)
    if (!updatedSpace) return
    spaces = spaces.map((s) => (s.spaceId === updatedSpace.spaceId ? updatedSpace : s))
    selectedSpace = updatedSpace
  }

  async function onDeleteSpace(space: Space): Promise<void> {
    await spaceService.deleteSpace(space)
    spaces = spaces.filter((s) => s.spaceId !== space.spaceId)
    selectedSpace = null
  }

  async function onUpdateChannel(channel: Channel): Promise<void> {
    const updatedChannel = await spaceService.updateChannel(channel)
    selectedSpace.channels = selectedSpace.channels.map((c) =>
      c.id === updatedChannel.id ? updatedChannel : c
    )
  }

  async function onDeleteChannel(channel: Channel): Promise<void> {
    await spaceService.deleteChannel(channel)
    selectedSpace.channels = selectedSpace.channels.filter((c) => c.id !== channel.id)
  }

  async function onRemoveSpaceMember(member: SpaceMember): Promise<void> {
    await spaceService.removeSpaceMember(member)
    selectedSpace.members = selectedSpace.members.filter((m) => m.user.id !== member.user.id)
  }

  async function confirmRemoveMember(): Promise<void> {
    if (!memberToRemove) return
    await onRemoveSpaceMember(memberToRemove)
    memberToRemove = null
  }
</script>

<div class="manage-spaces-window">
  <ManageSpacesList {spaces} {selectedSpace} {onSelectSpace} {onAddSpace} />
  <ManageSpaceInformation
    {selectedSpace}
    {onAddChannel}
    {onSaveInfo}
    {onDeleteSpace}
    {onUpdateChannel}
    {onDeleteChannel}
  />

  <ManageSpaceMembers
    {selectedSpace}
    {onAddMember}
    {onUpdateMemberRole}
    onRemoveMember={(member) => (memberToRemove = member)}
  />

  <ConfirmationModal
    open={memberToRemove !== null}
    title="Remove member"
    message="Are you sure you want to remove {memberToRemove?.user.displayName} from this space? They will lose access to all channels."
    confirmLabel="Remove"
    variant="delete"
    onConfirm={confirmRemoveMember}
    onClose={() => (memberToRemove = null)}
  />
</div>

<style>
  .manage-spaces-window {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
</style>
