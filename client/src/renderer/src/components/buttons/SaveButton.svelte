<script lang="ts">
  interface Props {
    isDirty: boolean
    onSave: () => void | Promise<void>
  }

  let { isDirty, onSave }: Props = $props()
  let saving = $state(false)

  async function handleSave(): void {
    saving = true
    await onSave()
    saving = false
  }
</script>

<button class="save-btn" disabled={!isDirty || saving} onclick={handleSave}>
  {saving ? 'Saving...' : 'Save'}
</button>

<style>
  .save-btn {
    background: transparent;
    color: #da6b10;
    border: 1px solid #da6b10;
    border-radius: 6px;
    padding: 4px 12px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition:
      opacity 0.15s,
      background 0.15s,
      color 0.15s;
    line-height: 1.5;
  }

  .save-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .save-btn:not(:disabled):hover {
    background: #da6b10;
    color: #fff;
  }
</style>
