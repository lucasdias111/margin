<script lang="ts">
  import marginLogo from '$src/assets/pics/margin.png'
  import { imageService } from '$src/services/ImageService'

  interface Props {
    marginIcon: string | null
    height?: number
    width?: number
  }

  let { marginIcon, height = 75, width = 75 }: Props = $props()
  let blobUrl = $state('')

  $effect(() => {
    if (!marginIcon) return () => {}
    if (!marginIcon.includes('/api/')) {
      blobUrl = marginIcon
      return () => {}
    }

    let cancelled = false
    imageService
      .getAuthenticatedImageUrl(marginIcon)
      .then((url) => {
        if (!cancelled) blobUrl = url
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  })
</script>

{#if blobUrl}
  <img
    src={blobUrl}
    alt="Margin icon"
    style="max-width: {width}px; max-height: {height}px;"
    class="user-avatar"
  />
{:else}
  <img
    class="defaultLogo"
    src={marginLogo}
    alt="Margin icon"
    style="max-width: {width}px; max-height: {height}px;"
  />
{/if}

<style>
  .defaultLogo {
    background: white;
  }
</style>
