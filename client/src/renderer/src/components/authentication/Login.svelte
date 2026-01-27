<script lang="ts">
  import { authenticationService } from '$src/services/AuthenticationService'
  import { push } from 'svelte-spa-router'

  let username = $state('')
  let password = $state('')
  let loginResponse = $state('')

  
async function handleLogin(event: SubmitEvent): Promise<void> {
  event.preventDefault()
    try {
      await authenticationService.login(username, password)
      loginResponse = 'Login successful'
      push('/home')
    } catch (error) {
      loginResponse = error.message || String(error)
    }
  }

  function goToRegister(): void {
    push('/register')
  }
</script>

<div>
  <form class="row" onsubmit={handleLogin}>
    <label>
      Username
      <input type="text" name="username" bind:value={username} />
    </label>
    <input type="password" name="password" bind:value={password} />
    <button type="submit">Login</button>
  </form>
  <p>{loginResponse}</p>
  <button onclick={goToRegister}>Register</button>
</div>

<style>
  .row {
    display: flex;
    justify-content: center;
  }

  p {
    text-align: center;
  }
</style>
