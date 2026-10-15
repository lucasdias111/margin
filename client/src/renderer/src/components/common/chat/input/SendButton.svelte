<script lang="ts">
  import Icon from '$src/components/common/icons/Icon.svelte'

  let { disabled }: { disabled: boolean } = $props()
</script>

<button class="sendbut" type="submit" {disabled} aria-label="Send" title="Send">
  <Icon name="send" size={18} color="white" />
</button>

<style>
  .sendbut {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 999px;
    background-color: #ff843c;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
    transition:
      background-color 0.2s,
      transform 0.1s;
  }

  .sendbut:hover:not(:disabled) {
    background-color: #e56e2a;
  }

  .sendbut:active:not(:disabled) {
    transform: scale(0.93);
  }

  .sendbut:disabled {
    background-color: #f5c4a0;
    cursor: not-allowed;
  }
</style>
