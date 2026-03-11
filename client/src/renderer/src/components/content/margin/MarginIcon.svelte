<script lang="ts">
  import marginLogo from '$src/assets/pics/margin.png'

  interface Props {
    marginIcon: string | null
    height?: number
    width?: number
  }

  let { marginIcon, height = 75, width = 75 }: Props = $props()
</script>

{#if marginIcon}
  <img
    src={marginIcon}
    alt="Margin icon"
    style="max-width: {width}px; max-height: {height}px;"
    class="user-avatar"
  />
{:else}
  <img src={marginLogo} alt="Margin icon" style="max-width: {width}px; max-height: {height}px;" />
{/if}
