<script lang="ts">
  import type { Snippet } from 'svelte'

  type ButtonType = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'delete' | 'list'
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
    class?: string
  }

  let {
    text,
    buttonType,
    size,
    onClick,
    fullWidth,
    disabled,
    children,
    onSave,
    class: extraClass
  }: ButtonProps = $props()
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
  class="but {buttonType} {size} {extraClass ?? ''}"
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
    font-weight: bold;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease,
      box-shadow 0.15s ease,
      transform 0.05s ease,
      opacity 0.15s ease;
  }

  .but:active:not(:disabled) {
    transform: scale(0.97);
  }

  .but.primary {
    background-color: #ff843c;
    color: white;
    border: none;
  }

  .but.primary:hover:not(:disabled) {
    background-color: #e06d2b;
    box-shadow: 0 2px 8px rgba(244, 126, 58, 0.3);
  }

  .but.secondary {
    background-color: white;
    color: #ff843c;
    border: rgba(244, 126, 58, 0.43) solid 1px;
  }

  .but.secondary:hover:not(:disabled) {
    background-color: rgba(244, 126, 58, 0.06);
    border-color: #ff843c;
  }

  .but.ternary {
    background-color: #312f2f;
    color: #ff843c;
    border: none;
  }

  .but.ternary:hover:not(:disabled) {
    background-color: #3d3b3b;
  }

  .but.danger {
    border: 0.5px solid #c0392b;
    color: #c0392b;
    border-radius: 8px;
    background: #fff8f8;
  }

  .but.danger:hover:not(:disabled) {
    background-color: #fff0ee;
    border-color: #a93226;
  }

  .but.delete {
    background: #c0392b;
    color: white;
    border: none;
  }

  .but.delete:hover:not(:disabled) {
    background-color: #a93226;
    box-shadow: 0 2px 8px rgba(192, 57, 43, 0.3);
  }

  .but.list {
    border-radius: 12px;
    border: 1px solid transparent;
    background: #fafafa;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    color: black;
  }

  .but.list:hover:not(:disabled) {
    border-color: #ebebeb;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
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
</style>
