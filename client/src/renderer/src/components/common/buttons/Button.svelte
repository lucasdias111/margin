<script lang="ts">
  type ButtonType = 'primary' | 'secondary' | 'ternary' | 'danger'
  type Size = 'small' | 'medium' | 'large'
  interface ButtonProps {
    text: string
    onClick?: (event: Event) => void
    buttonType: ButtonType
    size?: Size
    height?: number
    width?: number
    disabled?: boolean
  }

  let { text, buttonType, size, onClick }: ButtonProps = $props()
</script>

<button class="but {buttonType} {size}" onclick={onClick}> {text || 'Button text'}</button>

<style>
  .but {
    padding: 14px 18px;
    display: inline-block;
    width: fit-content;
    height: fit-content;
    cursor: pointer;
    font-family: inherit;
  }
  .but.primary {
    background-color: #f47e3a;
    color: white;
    border: none;
  }

  .but.secondary {
    background-color: white;
    color: #f47e3a;
    border: #312f2f solid 1px;
  }

  .but.ternary {
    background-color: #312f2f;
    color: #f47e3a;
    border: none;
  }

  .but.danger {
    border: 1px solid #f5c6c5;
    color: rgba(229, 18, 18, 0.62);
    border-radius: 8px;
    background: #fff8f8;
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
</style>
