<script lang="ts">
  import avatar from '$src/assets/pics/anonym-avatar.png'
  import { imageService } from '$src/services/ImageService'

  interface Props {
    profilePictureUrl: string | null
    height?: number
    width?: number
    rounded?: boolean
  }

  let { profilePictureUrl, height = 40, width = 40, rounded = true }: Props = $props()
  let blobUrl = $state('')

  $effect(() => {
    let cancelled = false

    if (!profilePictureUrl) {
      blobUrl = ''
    } else if (!profilePictureUrl.includes('/api/')) {
      blobUrl = profilePictureUrl
    } else {
      imageService.getAuthenticatedImageUrl(profilePictureUrl).then((url) => {
        if (!cancelled) blobUrl = url
      })
    }

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
    class:rounded
  />
{:else}
  <img
    src={avatar}
    alt="Profile"
    style="width: {width}px; height: {height}px"
    class="anon-avatar"
    class:rounded
  />
{/if}

<style>
  .user-avatar {
    object-fit: contain;
    border-radius: 8px;
  }

  .user-avatar.rounded,
  .anon-avatar.rounded {
    border-radius: 50%;
    object-fit: cover;
  }
</style>
