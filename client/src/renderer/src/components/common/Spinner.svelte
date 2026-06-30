<script lang="ts">
  interface Props {
    size?: number
    color?: string
  }

  let { size = 18, color = '#e8712a' }: Props = $props()
</script>

<div
  class="spinner"
  style="width: {size}px; height: {size}px; border-top-color: {color}; border-color: {color}33;"
></div>

<style>
  .spinner {
    border-style: solid;
    border-width: 2px;
    border-radius: 50%;
    animation: spin 0.65s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
