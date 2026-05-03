<script lang="ts">
  import { type Gif, gifService } from '$src/services/GifService'

  let { onSelect }: { onSelect: (gif: Gif) => void } = $props()

  let query = $state('')
  let results = $state<Gif[]>([])
  let nextCursor = $state('')
  let isLoading = $state(false)
  let error = $state<string | null>(null)
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  async function load(reset: boolean): Promise<void> {
    if (isLoading) return
    if (!reset && !nextCursor) return

    isLoading = true
    error = null
    try {
      const page = query.trim()
        ? await gifService.search(query.trim(), reset ? '' : nextCursor)
        : await gifService.featured(reset ? '' : nextCursor)
      results = reset ? page.results : [...results, ...page.results]
      nextCursor = page.next
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load GIFs'
    } finally {
      isLoading = false
    }
  }

  function onQueryChange(): void {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => load(true), 250)
  }

  function onScroll(e: Event): void {
    const el = e.currentTarget as HTMLDivElement
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
      load(false)
    }
  }

  $effect(() => {
    load(true)
  })
</script>

<div class="picker">
  <input
    class="search"
    type="text"
    placeholder="Search GIFs"
    bind:value={query}
    oninput={onQueryChange}
  />
  <div class="grid" onscroll={onScroll}>
    {#each results as gif (gif.id)}
      <button class="cell" type="button" onclick={() => onSelect(gif)} title={gif.description}>
        <img src={gif.thumbnailUrl} alt={gif.description} loading="lazy" />
      </button>
    {/each}
    {#if isLoading}
      <div class="status">Loading…</div>
    {/if}
    {#if error}
      <div class="status error">{error}</div>
    {/if}
    {#if !isLoading && !error && results.length === 0}
      <div class="status">No GIFs found</div>
    {/if}
  </div>
</div>

<style>
  .picker {
    width: 320px;
    height: 380px;
    background: white;
    border: 1px solid #e4cbb2;
    border-radius: 12px;
    box-shadow: rgb(38, 57, 77) 0px 20px 30px -10px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .search {
    margin: 10px;
    padding: 8px 12px;
    border: 1px solid #e4cbb2;
    border-radius: 999px;
    font: inherit;
    font-size: 13px;
    outline: none;
  }

  .search:focus {
    border-color: #f47e3a;
  }

  .grid {
    flex: 1;
    overflow-y: auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-auto-rows: 140px;
    gap: 6px;
    padding: 0 10px 10px;
    align-content: start;
  }

  .cell {
    padding: 0;
    border: none;
    background: #f5ece0;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    min-width: 0;
    min-height: 0;
  }

  .cell:hover {
    outline: 2px solid #f47e3a;
  }

  .cell img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .status {
    grid-column: 1 / -1;
    text-align: center;
    padding: 12px;
    font-size: 12px;
    color: #888;
  }

  .status.error {
    color: #c0392b;
  }
</style>
