<script lang="ts">
  import Icon from '$src/components/common/icons/Icon.svelte'

  let {
    disabled,
    locked = false,
    onFilesSelected,
    onLockedClick
  }: {
    disabled: boolean
    locked?: boolean
    onFilesSelected: (files: File[]) => void
    onLockedClick?: () => void
  } = $props()

  let fileInputRef: HTMLInputElement

  function handleClick(): void {
    if (locked) {
      onLockedClick?.()
      return
    }
    fileInputRef.click()
  }

  function handleChange(event: Event): void {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      onFilesSelected(Array.from(input.files))
    }
    input.value = ''
  }
</script>

<button
  class="secondary-button"
  class:locked
  type="button"
  onclick={handleClick}
  disabled={disabled && !locked}
  aria-label={locked ? 'Upgrade to attach files' : 'Attach file'}
  title={locked ? 'Upgrade your plan to attach files' : 'Attach file'}
>
  <Icon name="paperclip" size={16} strokeWidth={2} color={locked ? '#bbb' : '#f47e3a'} />
</button>
<input bind:this={fileInputRef} type="file" multiple hidden onchange={handleChange} />

<style>
  .secondary-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 999px;
    background-color: #ffffff;
    border: 1px solid #e4cbb2;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
    transition: background-color 0.2s;
  }

  .secondary-button:hover:not(.locked) {
    background-color: #fae0c8;
  }

  .secondary-button.locked {
    border-color: #e0e0e0;
    cursor: pointer;
  }

  .secondary-button.locked:hover {
    background-color: #f5f5f5;
  }
</style>