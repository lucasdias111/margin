<script lang="ts">
  import { errorState } from '$src/states/ErrorState.svelte'
</script>

{#if errorState.hasError}
  <div class="error">
    <span>{errorState.errorMessage}</span>
  </div>
{/if}

<style>
  .error {
    position: absolute;
    left: 0;
    width: 100%;
    background-color: #ef2121;
    color: white;
    font-size: 0.85rem;
    font-weight: 500;
    padding: 8px 16px;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: slideDown 0.3s ease;
  }

  @keyframes slideDown {
    from {
      transform: translateY(-100%);
      background-color: #ef2121;
      opacity: 0;
    }
    to {
      transform: translateY(0);
      background-color: #ef2121;
      opacity: 1;
    }
  }
</style>
