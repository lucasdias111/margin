<script lang="ts">
  interface OrangeButtonProps {
    text: string
    onClick?: () => void
    width?: number
    height?: number
  }

  let { text, height, width }: OrangeButtonProps = $props()
</script>

<button class="primary-but" style:height="{height}px" style:width="{width}px">
  {text || 'Button text'}</button
>

<style>
  .primary-but {
    background-color: #f47e3a;
    color: white;
    padding: 14px 18px;
    border-radius: 15px;
    border: none;
    display: inline-block;
    width: fit-content;
  }
</style>
