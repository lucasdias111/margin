<script lang="ts">
  import type { ShellState } from '../../../common/shell'

  interface Props {
    pendingLink: ShellState['pendingLink']
    canCancel: boolean
    onAdded: () => void
    onCancel: () => void
  }

  let { pendingLink, canCancel, onAdded, onCancel }: Props = $props()

  let address = $state('')
  let error = $state<string | null>(null)
  let busy = $state(false)

  // A link for an unknown server fills in its address.
  $effect(() => {
    if (pendingLink) address = pendingLink.origin
  })

  async function submit(event: SubmitEvent): Promise<void> {
    event.preventDefault()
    if (busy) return
    busy = true
    error = null
    const result = await window.shell.addServer(address)
    busy = false
    if (result.ok) {
      address = ''
      onAdded()
    } else {
      error = result.error
    }
  }
</script>

<div class="screen">
  <form class="card" onsubmit={submit}>
    {#if pendingLink}
      <h1>Add this server?</h1>
      <p>
        A link asked to open <strong>{pendingLink.url}</strong>, but {pendingLink.origin} isn’t one of
        your servers yet.
      </p>
    {:else}
      <h1>Add a server</h1>
      <p>Enter the address of your margin server, like <strong>chat.example.com</strong>.</p>
    {/if}

    <label for="address">Server address</label>
    <!-- svelte-ignore a11y_autofocus -->
    <input
      id="address"
      type="text"
      autocomplete="url"
      spellcheck="false"
      placeholder="chat.example.com"
      autofocus
      bind:value={address}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={error ? 'address-error' : undefined}
    />
    {#if error}
      <div id="address-error" class="error" role="alert">{error}</div>
    {/if}

    <div class="actions">
      {#if canCancel}
        <button type="button" class="secondary" onclick={onCancel}>Cancel</button>
      {/if}
      <button type="submit" class="primary" disabled={busy || !address.trim()}>
        {busy ? 'Checking…' : 'Add server'}
      </button>
    </div>
  </form>
</div>

<style>
  label {
    display: block;
    font-weight: 500;
    margin-bottom: 6px;
  }

  input {
    width: 100%;
    box-sizing: border-box;
    padding: 9px 11px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--bg);
    user-select: text;
  }

  .error {
    margin-top: 8px;
    color: var(--danger);
    user-select: text;
  }

  strong {
    color: var(--text);
    font-weight: 500;
    overflow-wrap: anywhere;
  }
</style>
