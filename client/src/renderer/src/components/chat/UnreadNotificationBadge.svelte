<script lang="ts">
  let {
    shouldShow
  }: {
    shouldShow: boolean
  } = $props()
</script>

<div>
  {#if shouldShow}
    <span class="badge">feeeeeeee</span>
  {/if}
</div>

<style>
  .badge {
    background-color: #b47024;
    color: white;
    border-radius: 10px;
    padding: 2px 5px;
    font-size: 12px;
    margin-left: 4px;
  }
</style>
