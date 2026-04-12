<script lang="ts">
  import avatar from '$src/assets/pics/anonym-avatar.png'
  import { imageService } from '$src/services/ImageService'

  interface Props {
    profilePictureUrl: string | null
    height?: number
    width?: number
  }

  let { profilePictureUrl, height = 40, width = 40 }: Props = $props()
  let blobUrl = $state('')

  $effect(() => {
    if (!profilePictureUrl) return () => {}
    if (!profilePictureUrl.includes('/api/')) {
      blobUrl = profilePictureUrl
      return () => {}
    }

    let cancelled = false
    imageService.getAuthenticatedImageUrl(profilePictureUrl).then(url => {
      if (!cancelled) blobUrl = url
    })
    return () => {
      cancelled = true
    }
  })
</script>

{#if blobUrl}
  <img
    src={blobUrl}
    alt="Profile"
    style="width: {width}px; height: {height}px;"
    class="user-avatar"
  />
{:else}
  <img
    src={avatar}
    alt="Profile"
    style="width: {width}px; height: {height}px"
    class="anon-avatar"
  />
{/if}

<style>
  .user-avatar {
    border-radius: 50%;
    object-fit: cover;
  }
</style>
