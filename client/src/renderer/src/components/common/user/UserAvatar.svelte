<script lang="ts">
  import avatar from '$src/assets/pics/anonym-avatar.png'

  interface Props {
    profilePictureUrl: string | null
    height?: number
    width?: number
  }

  let { profilePictureUrl, height = 40, width = 40 }: Props = $props()

</script>

{#if profilePictureUrl}
  <img
    src={profilePictureUrl}
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
