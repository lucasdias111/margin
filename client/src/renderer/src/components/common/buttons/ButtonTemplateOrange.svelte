<script lang="ts">
  type Size = 'small' | 'medium' | 'large' | 'ternary'
  interface ButtonProps {
    text: string
    onClick?: () => void
    size: Size
    height?: number
    width?: number
  }

  let { text, size, height, width }: ButtonProps = $props()
</script>

<button class="but {size}" style:height="{height}px" style:width="{width}px">
  {text || 'Button text'}</button
>

<style>
  .but.small {
    background-color: #f47e3a;
    color: white;
    padding: 14px 18px;
    border-radius: 9999px;
    border: none;
    display: inline-block;
    width: fit-content;
  }

  .but.medium {
    background-color: white;
    color: #f47e3a;
    padding: 14px 18px;
    border-radius: 999px;
    border: none;
    display: inline-block;
    width: fit-content;
  }

  .but.large {
  }
</style>
