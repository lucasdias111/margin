<script lang="ts">
  import AppModal from '$src/components/common/modals/AppModal.svelte'
  import Button from '$src/components/common/buttons/Button.svelte'

  interface Props {
    open: boolean
    onClose: () => void
    onSubmit: (report: { title: string; description: string }) => Promise<void>
  }

  let { open, onClose, onSubmit }: Props = $props()

  let title = $state('')
  let description = $state('')
  let loading = $state(false)
  let error = $state<string | null>(null)
  let submitted = $state(false)

  async function handleSubmit(): Promise<void> {
    if (!title.trim() || !description.trim()) return
    loading = true
    error = null
    try {
      await onSubmit({ title: title.trim(), description: description.trim() })
      submitted = true
    } catch (e) {
      error = 'Failed to submit report. Try again.'
    } finally {
      loading = false
    }
  }

  function handleClose(): void {
    onClose()
    clear()
  }

  function clear(): void {
    title = ''
    description = ''
    loading = false
    error = null
    submitted = false
  }
</script>

<AppModal {open} title="Report a Bug" onClose={handleClose}>
  {#if submitted}
    <div class="success-message">
      <span>Thanks! Your report has been submitted.</span>
    </div>
    <div class="actions">
      <Button buttonType="primary" size="small" onClick={handleClose} text="Done" />
    </div>
  {:else}
    <div class="form">
      <div class="field">
        <label class="field-label" for="bug-title">Title</label>
        <input
          id="bug-title"
          class="input"
          type="text"
          placeholder="Short summary of the issue"
          bind:value={title}
          maxlength="120"
        />
      </div>

      <div class="field">
        <label class="field-label" for="bug-description">Description</label>
        <textarea
          id="bug-description"
          class="input textarea"
          placeholder="What happened? What did you expect?"
          bind:value={description}
          maxlength="1000"
          rows="5"
        ></textarea>
      </div>

      {#if error}
        <span class="error">{error}</span>
      {/if}
    </div>

    <div class="actions">
      <Button buttonType="secondary" size="small" text="Cancel" onClick={handleClose} />
      <Button
        buttonType="primary"
        size="small"
        text="Submit"
        onClick={handleSubmit}
        disabled={loading || !title.trim() || !description.trim()}
      ></Button>
    </div>
  {/if}
</AppModal>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #888;
  }

  .input {
    padding: 8px 14px;
    border-radius: 10px;
    border: 1.5px solid #ebebeb;
    background: #fafafa;
    outline: none;
    font-family: inherit;
    font-size: 13px;
    color: #2a2a2a;
    box-sizing: border-box;
    transition:
      border-color 0.15s,
      background 0.15s;
    width: 100%;
  }

  .input:focus {
    border-color: #ff843c;
    background: white;
  }

  .input::placeholder {
    color: #c1c1c1;
  }

  .textarea {
    resize: vertical;
    min-height: 100px;
  }

  .error {
    font-size: 12px;
    color: #c0392b;
  }

  .success-message {
    padding: 14px 16px;
    background: #eef6ee;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    color: #3d8a52;
    margin-bottom: 8px;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 5% 0 1% 0;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
