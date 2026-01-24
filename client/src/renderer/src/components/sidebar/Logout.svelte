<script lang="ts">
  import { authenticationService } from '$src/services/AuthenticationService'
  import { userState } from '$src/states/UserState.svelte'
  import { push } from 'svelte-spa-router'

  async function handleLogout(): Promise<void> {
    if (!userState.currentUser.id) return
    await authenticationService.logoutUser(userState.currentUser.id)
    await push('/')
  }
</script>

<div>
  <button class="logoutbut" onclick={handleLogout}>Log out</button>
</div>

<style>
  .logoutbut {
    background: darkslategrey;
    color: white;
    padding: 8px;
    position: absolute;
    left: 100px;
    bottom: 10px;
  }
</style>
