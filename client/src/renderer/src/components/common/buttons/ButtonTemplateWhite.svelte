<script lang="ts">
  interface WhiteButtonProps {
    text: string
    onClick?: () => void
    width?: number
    height?: number
  }

  let { text, height, width }: WhiteButtonProps = $props()
</script>

<button class="primary-but" style:height="{height}px" style:width="{width}px">
  {text || 'Button text'}</button
>

<style>
  .primary-but {
    background-color: white;
    color: #f47e3a;
    padding: 14px 18px;
    border-radius: 999px;
    border: none;
    display: inline-block;
    width: fit-content;
  }
</style>
