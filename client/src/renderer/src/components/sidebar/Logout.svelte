<script lang="ts">
  import { authenticationService } from '$src/services/AuthenticationService'
  import { push } from 'svelte-spa-router'

  let userId = $state(0)

  async function handleLogout(event: SubmitEvent): Promise<void> {
    event.preventDefault()
    return (authenticationService.logoutUser(userId), push('/auth/logout'))
  }
</script>

<div>
  <button class="logoutbut" onsubmit={handleLogout}>Log out</button>
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
