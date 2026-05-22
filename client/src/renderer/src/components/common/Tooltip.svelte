<script lang="ts">
  interface Props {
    text: string
    open: boolean
  }

  let { text, open }: Props = $props()
</script>

{#if open}
  <div class="tooltip">{text}</div>
{/if}

<style>
  .tooltip {
    position: absolute;
    left: calc(100% + 10px);
    top: 50%;
    transform: translateY(-50%);
    width: 180px;
    background: #ffffff;
    border: 1px solid #ece8e0;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 12px;
    color: #555250;
    line-height: 1.5;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    z-index: 10;
    pointer-events: none;
  }

  .tooltip::before {
    content: '';
    position: absolute;
    top: 50%;
    right: 100%;
    transform: translateY(-50%);
    border: 6px solid transparent;
    border-right-color: #ece8e0;
  }

  .tooltip::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 100%;
    transform: translateY(-50%);
    margin-right: -1px;
    border: 5px solid transparent;
    border-right-color: #ffffff;
  }
</style>