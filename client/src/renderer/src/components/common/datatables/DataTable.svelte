<script lang="ts" generics="T">
  interface Column<T> {
    key: string
    label: string
    render?: (row: T) => string
  }

  interface Props<T> {
    columns: Column<T>[]
    rows: T[]
    onEdit?: (row: T) => void
    onDelete?: (row: T) => void
    onAdd?: () => void
    getKey: (row: T) => string | number
  }

  let { columns, rows, onEdit, onDelete, onAdd, getKey }: Props<T> = $props()

  const gridCols = $derived(`grid-template-columns: ${columns.map(() => '1fr').join(' ')} 60px`)
</script>

<div class="table-card">
  <div class="table-header" style={gridCols}>
    {#each columns as col (col.key)}
      <span>{col.label}</span>
    {/each}
    <span></span>
  </div>

  {#each rows as row (getKey(row))}
    <div class="table-row" style={gridCols}>
      {#each columns as col (col.key)}
        <span>{col.render ? col.render(row) : row[col.key]}</span>
      {/each}
      <div class="row-actions">
        {#if onEdit}
          <button class="icon-btn" onclick={() => onEdit(row)}>✏️</button>
        {/if}
        {#if onDelete}
          <button class="icon-btn" onclick={() => onDelete(row)}>🗑️</button>
        {/if}
      </div>
    </div>
  {/each}

  {#if onAdd}
    <button class="add-row-btn" onclick={onAdd}>+</button>
  {/if}
</div>

<style>
  .table-card {
    border: 1px solid #e8e8e8;
    border-radius: 10px;
    overflow: hidden;
  }

  .table-header {
    display: grid;
    padding: 8px 16px;
    font-size: 0.78rem;
    color: #888;
    background: #fafafa;
    border-bottom: 1px solid #e8e8e8;
  }

  .table-row {
    display: grid;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 0.9rem;
  }

  .table-row:last-of-type {
    border-bottom: none;
  }

  .row-actions {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
  }

  .icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.9rem;
    padding: 2px;
    line-height: 1;
  }

  .add-row-btn {
    width: 100%;
    background: #f5f5f5;
    border: none;
    border-top: 1px solid #e8e8e8;
    padding: 10px;
    font-size: 1.1rem;
    cursor: pointer;
    color: #555;
    border-radius: 0 0 10px 10px;
  }

  .add-row-btn:hover {
    background: #eeeeee;
  }

  span {
    color: #2d2d2d;
  }
</style>
