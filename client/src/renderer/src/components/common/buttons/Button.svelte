<script lang="ts">
  import type { Snippet } from 'svelte'

  type ButtonType = 'primary' | 'secondary' | 'ternary' | 'danger' | 'delete' | 'list'
  type Size = 'small' | 'medium' | 'large'
  interface ButtonProps {
    text?: string
    onClick?: (event: Event) => void
    buttonType: ButtonType
    size?: Size
    disabled?: boolean
    fullWidth?: boolean
    children?: Snippet
    onSave?: () => void | Promise<void>
  }

  let { text, buttonType, size, onClick, fullWidth, disabled, children, onSave }: ButtonProps =
    $props()
  let saving = $state(false)

  async function handleSave(): Promise<void> {
    if (!onSave) saving = true
    try {
      await onSave()
    } finally {
      saving = false
    }
  }
</script>

<button
  class="but {buttonType} {size}"
  class:full-width={fullWidth}
  onclick={onSave ? handleSave : onClick}
  disabled={disabled || saving}
>
  {#if children}
    {@render children()}
  {:else if saving}
    Saving...
  {:else}
    {text || 'Button text'}
  {/if}</button
>

<style>
  .but {
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
    height: fit-content;
    cursor: pointer;
    font-family: inherit;
  }
  .but.primary {
    background-color: #f47e3a;
    color: white;
    border: none;
    cursor: pointer;
  }

  .but.secondary {
    background-color: white;
    color: #f47e3a;
    border: rgba(244, 126, 58, 0.43) solid 1px;
    cursor: pointer;
  }

  .but.ternary {
    background-color: #312f2f;
    color: #f47e3a;
    border: none;
    cursor: pointer;
  }

  .but.danger {
    border: 0.5px solid #c0392b;
    color: #c0392b;
    border-radius: 8px;
    background: #fff8f8;
    cursor: pointer;
  }

  .but.delete {
    background: #c0392b;
    color: white;
    border: none;
    cursor: pointer;
  }

  .but.list {
    border-radius: 12px;
    border: 1px solid transparent;
    background: #fafafa;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    color: black;
  }

  .but.small {
    border-radius: 10px;
    padding: 8px 16px;
    font-size: 11px;
  }

  .but.medium {
    border-radius: 15px;
    padding: 12px 22px;
    font-size: 13px;
  }

  .but.large {
    border-radius: 15px;
    padding: 15px 30px;
    font-size: 15px;
  }

  .but.full-width:not(.list) {
    width: 100%;
    justify-content: center;
  }

  .but.full-width {
    width: 100%;
    justify-content: flex-start;
  }

  .but:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .but.list:hover {
    border-color: #ebebeb;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }
</style>
