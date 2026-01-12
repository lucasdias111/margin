<script lang="ts">
  import { authenticationService } from '$src/services/AuthenticationService'
  import { error } from 'console'
  import { push } from 'svelte-spa-router'

  // /logout

  async function logoutUser(): Promise<void> {
    try {
      await authenticationService.logoutUser()
      push('/')
    } catch (error) {
      console.log(error)
    }
  }
</script>

<div>
  <button class="logoutbut" onclick={logoutUser}>Log out</button>
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
