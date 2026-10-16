<script lang="ts">
  import type { PickerSource } from '../../../common/shell'

  interface Props {
    sources: PickerSource[]
  }

  let { sources }: Props = $props()

  let selected = $state<string | null>(null)

  const screens = $derived(sources.filter((source) => source.kind === 'screen'))
  const windows = $derived(sources.filter((source) => source.kind === 'window'))

  function share(): void {
    if (selected) window.shell.chooseSource(selected)
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') window.shell.chooseSource(null)
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="backdrop">
  <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="picker-title">
    <h1 id="picker-title">Choose what to share</h1>

    <div class="groups">
      {#each [{ label: 'Screens', items: screens }, { label: 'Windows', items: windows }] as group (group.label)}
        {#if group.items.length > 0}
          <h2>{group.label}</h2>
          <div class="grid">
            {#each group.items as source (source.id)}
              <button
                class="source"
                class:selected={selected === source.id}
                aria-pressed={selected === source.id}
                onclick={() => (selected = source.id)}
                ondblclick={() => window.shell.chooseSource(source.id)}
              >
                <img src={source.thumbnail} alt="" />
                <span>{source.name}</span>
              </button>
            {/each}
          </div>
        {/if}
      {/each}
      {#if sources.length === 0}
        <p class="empty">
          Nothing to share. On macOS, allow margin under Screen Recording in System Settings.
        </p>
      {/if}
    </div>

    <div class="actions">
      <button class="secondary" onclick={() => window.shell.chooseSource(null)}>Cancel</button>
      <button class="primary" disabled={!selected} onclick={share}>Share</button>
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .dialog {
    width: min(760px, 100%);
    max-height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 22px;
    box-sizing: border-box;
  }

  h1 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 8px;
  }

  h2 {
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 14px 0 8px;
  }

  .groups {
    overflow: auto;
    min-height: 0;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 10px;
  }

  .source {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    border-radius: 10px;
    border: 1px solid transparent;
    background: var(--bg);
    text-align: left;
  }

  .source:hover {
    border-color: var(--border);
  }

  .source.selected {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }

  img {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: contain;
    background: #000;
    border-radius: 6px;
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .empty {
    color: var(--muted);
  }
</style>
