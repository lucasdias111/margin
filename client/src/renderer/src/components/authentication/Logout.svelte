<script lang="ts">
  import { authenticationService } from '$src/services/AuthenticationService'
  import { userState } from '$src/states/UserState.svelte.js'
  import { push } from 'svelte-spa-router'
  import LogoutIcon from '$src/components/svg/LogoutIcon.svelte'


  export async function handleLogout(): Promise<void> {
    if (!userState.currentUser.id) return
    await authenticationService.logoutUser(userState.currentUser.id)
    await push('/')
  }
</script>

<button onclick={handleLogout}>
  <LogoutIcon />
</button>
