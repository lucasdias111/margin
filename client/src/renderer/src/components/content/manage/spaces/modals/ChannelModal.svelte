<script lang="ts">
  import AppModal from '$src/components/common/modals/AppModal.svelte'
  import { ChannelType, type Channel, type CreateChannel } from '$src/interfaces/Channel'

  interface Props {
    spaceId: number
    open: boolean
    onClose: () => void
    onSubmit: (channel: CreateChannel) => void
    editChannel?: Channel | null
  }

  let { spaceId, open, onClose, onSubmit, editChannel = null }: Props = $props()

  let channelName = $state('')
  let description = $state('')
  let type = $state<ChannelType>(ChannelType.COMMUNICATION)

  $effect(() => {
    channelName = editChannel?.name ?? ''
    description = editChannel?.description ?? ''
    type = (editChannel?.type as ChannelType) ?? ChannelType.COMMUNICATION
  })

  const isEditing = $derived(editChannel != null)

  function handleSubmit(): void {
    onSubmit({
      name: channelName,
      description,
      spaceId,
      channelType: type
    })
    channelName = ''
    description = ''
    type = ChannelType.COMMUNICATION
    onClose()
  }
</script>

<AppModal {open} title={isEditing ? 'Edit Channel' : 'Add Channel'} {onClose}>
  <input
    type="text"
    placeholder="Channel name"
    bind:value={channelName}
    onkeydown={(e) => e.key === 'Enter' && handleSubmit()}
  />
  <textarea placeholder="Description" bind:value={description} rows="3"></textarea>
  <select bind:value={type}>
    {#each Object.values(ChannelType) as channelType (channelType.valueOf())}
      <option value={channelType}>{channelType}</option>
    {/each}
  </select>
  <div class="actions">
    <button class="cancel" onclick={onClose}>Cancel</button>
    <button class="confirm" onclick={handleSubmit}>
      {isEditing ? 'Update' : 'Create'}
    </button>
  </div>
</AppModal>

<style>
  input,
  textarea,
  select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    font-size: 0.95rem;
    box-sizing: border-box;
    margin-bottom: 16px;
  }

  textarea {
    resize: vertical;
  }

  select {
    appearance: auto;
    background: #fff;
    cursor: pointer;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .cancel {
    background: none;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    padding: 8px 16px;
    cursor: pointer;
    color: #2d2d2d;
  }

  .confirm {
    background: #ff6203;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-weight: 600;
    cursor: pointer;
  }
</style>
