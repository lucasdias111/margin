<script lang="ts">
  import type { Space } from '$src/interfaces/Space'
  import type { Channel, CreateChannel } from '$src/interfaces/Channel'
  import DataTable from '$src/components/datatables/DataTable.svelte'
  import ChannelModal from '$src/components/manage/spaces/modals/ChannelModal.svelte'

  interface Props {
    selectedSpace: Space
    onAddChannel: (channel: CreateChannel) => Promise<void>
    onUpdateChannel: (channel: Channel) => Promise<void>
    onDeleteChannel: (channel: Channel) => Promise<void>
  }

  let { selectedSpace, onAddChannel, onUpdateChannel, onDeleteChannel }: Props = $props()

  let modalOpen = $state(false)
  let editingChannel = $state<Channel | null>(null)

  function openAdd(): void {
    editingChannel = null
    modalOpen = true
  }

  function openEdit(channel: Channel): void {
    editingChannel = channel
    modalOpen = true
  }

  function handleClose(): void {
    modalOpen = false
    editingChannel = null
  }

  function handleSubmit(channel: CreateChannel): void {
    if (editingChannel) {
      onUpdateChannel({ ...editingChannel, ...channel })
    } else {
      onAddChannel(channel)
    }
  }
</script>

<div class="spaces-details">
  <h2>Channels</h2>
  <DataTable
    columns={[
      { key: 'name', label: 'Channel name' },
      { key: 'type', label: 'Channel type' },
      { key: 'description', label: 'Description' }
    ]}
    rows={selectedSpace.channels}
    getKey={(row) => row.id}
    onEdit={(row) => openEdit(row)}
    onDelete={(row) => onDeleteChannel(row)}
    onAdd={openAdd}
  />
</div>

<ChannelModal
  spaceId={selectedSpace.spaceId}
  open={modalOpen}
  editChannel={editingChannel}
  onClose={handleClose}
  onSubmit={handleSubmit}
/>

<style>
  .spaces-details {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  h2 {
    font-size: 1.1rem;
    color: #2d2d2d;
    font-weight: 600;
    margin: 0;
  }
</style>
