<script lang="ts" generics="T">
  interface Column<T> {
    key: string
    label: string
    sortable?: boolean
    flex?: number
    render?: (row: T) => string
  }

  interface Props<T> {
    columns: Column<T>[]
    rows: T[]
    getKey: (row: T) => string | number
    onAction?: (row: T) => void
    searchPlaceholder?: string
    searchFilter?: (row: T, query: string) => boolean
  }

  let {
    columns,
    rows,
    getKey,
    onAction,
    searchPlaceholder = 'Search...',
    searchFilter
  }: Props<T> = $props()

  let searchQuery = $state('')
  let sortKey = $state<string | null>(null)
  let sortAsc = $state(true)

  const gridCols = $derived(
    `grid-template-columns: ${columns.map((c) => `${c.flex ?? 1}fr`).join(' ')} ${onAction ? '30px' : ''}`
  )

  const filteredRows = $derived(() => {
    let result = rows

    if (searchQuery && searchFilter) {
      result = result.filter((row) => searchFilter(row, searchQuery.toLowerCase()))
    }

    if (sortKey) {
      result = [...result].sort((a, b) => {
        const aVal = String(a[sortKey])
        const bVal = String(b[sortKey])
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      })
    }

    return result
  })

  function toggleSort(key: string): void {
    if (sortKey === key) {
      sortAsc = !sortAsc
    } else {
      sortKey = key
      sortAsc = true
    }
  }
</script>

<div class="list-view">
  {#if searchFilter}
    <div class="search-bar">
      <input type="text" placeholder={searchPlaceholder} bind:value={searchQuery} />
    </div>
  {/if}

  <div class="list-header" style={gridCols}>
    {#each columns as col (col.key)}
      {#if col.sortable}
        <button class="header-btn" onclick={() => toggleSort(col.key)}>
          {col.label}
          {#if sortKey === col.key}
            {sortAsc ? '↑' : '↓'}
          {/if}
        </button>
      {:else}
        <span>{col.label}</span>
      {/if}
    {/each}
    {#if onAction}<span></span>{/if}
  </div>

  {#each filteredRows() as row (getKey(row))}
    <div class="list-row" style={gridCols}>
      {#each columns as col (col.key)}
        <span class="cell">{col.render ? col.render(row) : row[col.key]}</span>
      {/each}
      {#if onAction}
        <button class="icon-btn" onclick={() => onAction(row)}>⋮</button>
      {/if}
    </div>
  {/each}
</div>

<style>
  .list-view {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .search-bar {
    margin-bottom: 12px;
  }

  .search-bar input {
    border: 1px solid #d9d9d9;
    border-radius: 20px;
    padding: 8px 16px;
    font-size: 0.88rem;
    outline: none;
    width: 180px;
    background: #f5f5f5;
  }

  .list-header {
    display: grid;
    font-size: 0.78rem;
    color: #888;
    padding: 6px 0 8px 0;
    border-bottom: 1px solid #d9d9d9;
  }

  .list-row {
    display: grid;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
    font-size: 0.9rem;
    color: #2d2d2d;
  }

  .header-btn {
    background: none;
    border: none;
    padding: 0;
    font-size: 0.78rem;
    color: #888;
    cursor: pointer;
    text-align: left;
    user-select: none;
  }

  .header-btn:hover {
    color: #2d2d2d;
  }

  .icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    padding: 2px;
    color: #888;
  }
</style>
