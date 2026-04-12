<!--<script lang="ts">-->
<!--  interface Props {-->
<!--    label: string-->
<!--    onAction: () => void | Promise<void>-->
<!--  }-->

<!--  let { label, onAction }: Props = $props()-->
<!--  let loading = $state(false)-->

<!--  async function handleClick(): Promise<void> {-->
<!--    loading = true-->
<!--    await onAction()-->
<!--    loading = false-->
<!--  }-->
<!--</script>-->

<!--<button class="danger-btn" disabled={loading} onclick={handleClick}>-->
<!--  {loading ? 'Loading...' : label}-->
<!--</button>-->

<!--<style>-->
<!--  .danger-btn {-->
<!--    background: transparent;-->
<!--    color: #d9534f;-->
<!--    border: 1px solid #d9534f;-->
<!--    border-radius: 6px;-->
<!--    padding: 4px 12px;-->
<!--    font-size: 0.8rem;-->
<!--    font-weight: 500;-->
<!--    cursor: pointer;-->
<!--    transition:-->
<!--      opacity 0.15s,-->
<!--      background 0.15s,-->
<!--      color 0.15s;-->
<!--    line-height: 1.5;-->
<!--  }-->

<!--  .danger-btn:disabled {-->
<!--    opacity: 0.4;-->
<!--    cursor: not-allowed;-->
<!--  }-->

<!--  .danger-btn:not(:disabled):hover {-->
<!--    background: #d9534f;-->
<!--    color: #fff;-->
<!--  }-->
<!--</style>-->
