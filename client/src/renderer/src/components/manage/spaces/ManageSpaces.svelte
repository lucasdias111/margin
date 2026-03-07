<script lang="ts">
  import ManageSpaceInformation from '$src/components/manage/spaces/ManageSpaceInformation.svelte'
  import ManageSpaceMembers from '$src/components/manage/spaces/ManageSpaceMembers.svelte'
  import ManageSpacesList from '$src/components/manage/spaces/ManageSpacesList.svelte'
  import type { CreateSpace, Space, SpaceMember } from '$src/interfaces/Space'
  import { onMount } from 'svelte'
  import { spacesService } from '$src/services/SpacesService'
  import type { Channel, CreateChannel } from '$src/interfaces/Channel'
  import { chatService } from '$src/services/ChatService'
  import { chatState } from '$src/states/ChatState.svelte'

  let spaces = $state<Space[]>([])
  let selectedSpace = $state<Space | null>(null)

  onMount(async () => {
    try {
      spaces = await spacesService.getAllSpacesForMargin(chatState.selectedMargin.marginId)
    } catch (e) {
      console.error('Failed to load spaces:', e)
    }
  })

  function onSelectSpace(space: Space): void {
    selectedSpace = space
  }

  async function onAddSpace(space: CreateSpace): Promise<void> {
    try {
      const newSpace = await spacesService.addSpace(space)
      spaces = [...spaces, newSpace]
    } catch (e) {
      console.error('Failed to create space:', e)
    }
  }

  async function onAddMember(user: SpaceMember): Promise<void> {
    try {
      const newMember = await spacesService.addSpaceMemberToSpace(user)
      selectedSpace.members = [...selectedSpace.members, newMember]
    } catch (e) {
      console.error('Failed to add member:', e)
    }
  }

  async function onUpdateMemberRole(spaceMember: SpaceMember): Promise<void> {
    try {
      const updated = await spacesService.updateSpaceMemberRole(spaceMember)
      selectedSpace.members = selectedSpace.members.map((m) =>
        m.user.id === updated.user.id ? updated : m
      )
    } catch (e) {
      console.error('Failed to update member role:', e)
    }
  }
  async function onAddChannel(channel: CreateChannel): Promise<void> {
    try {
      const newChannel = await spacesService.createChannel(channel)
      selectedSpace.channels = [...selectedSpace.channels, newChannel]
    } catch (e) {
      console.error('Failed to create channel:', e)
    }
  }

  async function onSaveInfo(space: Space): Promise<void> {
    try {
      const updatedSpace = await spacesService.updateSpaceInfo(space)
      spaces = spaces.map((s) => (s.spaceId === updatedSpace.spaceId ? updatedSpace : s))
      selectedSpace = updatedSpace
    } catch (e) {
      console.error('Failed to update space:', e)
    }
  }

  async function onDeleteSpace(space: Space): Promise<void> {
    try {
      await spacesService.deleteSpace(space)
      spaces = spaces.filter((s) => s.spaceId !== space.spaceId)
      selectedSpace = null
    } catch (e) {
      console.error('Failed to delete space:', e)
    }
  }

  async function onUpdateChannel(channel: Channel): Promise<void> {
    try {
      const updatedChannel = await spacesService.updateChannel(channel)
      selectedSpace.channels = selectedSpace.channels.map((c) =>
        c.id === updatedChannel.id ? updatedChannel : c
      )
    } catch (e) {
      console.error('Failed to update channel:', e)
    }
  }

  async function onDeleteChannel(channel: Channel): Promise<void> {
    try {
      await spacesService.deleteChannel(channel)
      selectedSpace.channels = selectedSpace.channels.filter((c) => c.id !== channel.id)
    } catch (e) {
      console.error('Failed to delete channel:', e)
    }
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
  <ManageSpaceMembers {selectedSpace} {onAddMember} {onUpdateMemberRole} />
</div>

<style>
  .manage-spaces-window {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
</style>
