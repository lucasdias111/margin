<script lang="ts">
  import type { Space } from '$src/interfaces/Space'
  import type { Channel, CreateChannel } from '$src/interfaces/Channel'
  import MangeSpaceInformationDetails from '$src/components/manage/spaces/MangeSpaceInformationDetails.svelte'
  import MangeSpaceInformationChannels from '$src/components/manage/spaces/MangeSpaceInformationChannels.svelte'

  interface Props {
    selectedSpace: Space
    onAddChannel: (channel: CreateChannel) => Promise<void>
    onSaveInfo?: (space: Space) => Promise<void>
    onDeleteSpace?: (space: Space) => Promise<void>
    onUpdateChannel: (channel: Channel) => Promise<void>
    onDeleteChannel: (channel: Channel) => Promise<void>
  }

  let {
    selectedSpace,
    onAddChannel,
    onSaveInfo,
    onDeleteSpace,
    onUpdateChannel,
    onDeleteChannel
  }: Props = $props()
</script>

<div class="spaces-information">
  {#if selectedSpace}
    <MangeSpaceInformationDetails {selectedSpace} {onSaveInfo} {onDeleteSpace} />
    <MangeSpaceInformationChannels
      {selectedSpace}
      {onAddChannel}
      {onUpdateChannel}
      {onDeleteChannel}
    />
  {/if}
</div>

<style>
  .spaces-information {
    flex: 2;
    border-right: 1px solid #d9d9d9;
    padding: 20px 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
</style>
