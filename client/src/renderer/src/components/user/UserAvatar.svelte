<script lang="ts">
  interface Props {
    profilePictureUrl: string | null
    height?: number
    width?: number
  }

  let { profilePictureUrl, height = 40, width = 40 }: Props = $props()
</script>

<img
  src={profilePictureUrl}
  alt="Profile"
  style="width: {width}px; height: {height}px;"
  class="user-avatar"
/>

<style>
  .user-avatar {
    border-radius: 50%;
    object-fit: cover;
  }
</style>
