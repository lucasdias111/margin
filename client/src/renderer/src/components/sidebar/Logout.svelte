<script lang="ts">
  import { authenticationService } from '$src/services/AuthenticationService'
  import { userState } from '$src/states/UserState.svelte'
  import { push } from 'svelte-spa-router'

  export async function handleLogout(): Promise<void> {
    if (!userState.currentUser.id) return
    await authenticationService.logoutUser(userState.currentUser.id)
    await push('/')
  }
</script>


<button class="logoutbut" onclick={handleLogout}>Log out</button>

<style>
  .logoutbut {
    background: #da6b10;
    color: white;
    padding: 8px;
    border: none;
    opacity: 1;
  }
</style>
