<script lang="ts">
  import ManageSpaceInformation from '$src/components/content/manage/spaces/ManageSpaceInformation.svelte'
  import ManageSpaceMembers from '$src/components/content/manage/spaces/ManageSpaceMembers.svelte'
  import ManageSpacesList from '$src/components/content/manage/spaces/ManageSpacesList.svelte'
  import type { CreateSpace, Space, SpaceMember } from '$src/interfaces/Space'
  import { onMount } from 'svelte'
  import { spacesService } from '$src/services/SpacesService'
  import type { Channel, CreateChannel } from '$src/interfaces/Channel'
  import { chatState } from '$src/states/ChatState.svelte.js'

  let spaces = $state<Space[]>([])
  let selectedSpace = $state<Space | null>(null)

  onMount(async () => {
    spaces = await spacesService.getAllSpacesForMargin(chatState.selectedMargin.marginId)
  })

  function onSelectSpace(space: Space): void {
    selectedSpace = space
  }

  async function onAddSpace(space: CreateSpace): Promise<void> {
    let newSpace: Space
    newSpace = await spacesService.createSpace(space)
    if (!newSpace) return
    spaces = [...spaces, newSpace]
  }

  async function onAddMember(user: SpaceMember): Promise<void> {
    const newMember = await spacesService.addSpaceMemberToSpace(user)
    if (!newMember) return
    selectedSpace.members = [...selectedSpace.members, newMember]
  }

  async function onUpdateMemberRole(spaceMember: SpaceMember): Promise<void> {
    const updated = await spacesService.updateSpaceMemberRole(spaceMember)
    if (!updated) return
    selectedSpace.members = selectedSpace.members.map((m) =>
      m.user.id === updated.user.id ? updated : m
    )
  }

  async function onAddChannel(channel: CreateChannel): Promise<void> {
    const newChannel = await spacesService.createChannel(channel)
    if (!newChannel) return
    selectedSpace.channels = [...selectedSpace.channels, newChannel]
  }

  async function onSaveInfo(space: Space): Promise<void> {
    const updatedSpace = await spacesService.updateSpaceInfo(space)
    if (!updatedSpace) return
    spaces = spaces.map((s) => (s.spaceId === updatedSpace.spaceId ? updatedSpace : s))
    selectedSpace = updatedSpace
  }

  async function onDeleteSpace(space: Space): Promise<void> {
    await spacesService.deleteSpace(space)
    spaces = spaces.filter((s) => s.spaceId !== space.spaceId)
    selectedSpace = null
  }

  async function onUpdateChannel(channel: Channel): Promise<void> {
    const updatedChannel = await spacesService.updateChannel(channel)
    selectedSpace.channels = selectedSpace.channels.map((c) =>
      c.id === updatedChannel.id ? updatedChannel : c
    )
  }

  async function onDeleteChannel(channel: Channel): Promise<void> {
    await spacesService.deleteChannel(channel)
    selectedSpace.channels = selectedSpace.channels.filter((c) => c.id !== channel.id)
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
