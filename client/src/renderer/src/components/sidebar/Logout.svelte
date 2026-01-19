<script lang="ts">
  import { authenticationService } from '$src/services/AuthenticationService'
  import { userState } from '$src/states/UserState.svelte'
  import { push } from 'svelte-spa-router'

  let userId = userState.currentUser.id

  async function handleLogout(): Promise<void> {
    return (authenticationService.logoutUser(userId), push('/'))
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
