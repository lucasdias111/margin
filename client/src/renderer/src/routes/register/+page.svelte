<script lang="ts">
  import { authenticationService } from '$src/services/AuthenticationService'
  import { push } from 'svelte-spa-router'

  let username = $state('')
  let password = $state('')
  let repeatPassword = $state('')
  let email = $state('')
  let loginResponse = $state('')

  async function handleRegistration(event: SubmitEvent): Promise<void> {
    try {
      event.preventDefault()
      await authenticationService.register(username, password, email)
      push('/')
    } catch (error: any) {
      console.log('Error logging in: ' + error)
    }
  }

  function goBack(): void {
    push('/')
  }
</script>

<div>
  <h1>Register</h1>
  <form class="row" onsubmit={handleRegistration}>
    <label for="username">Username</label>
    <input id="username" type="text" name="username" bind:value={username} />
    <label for="password">Password</label>
    <input id="password" type="password" name="password" bind:value={password} />
    <label for="repeatPassword">Repeat password</label>
    <input id="repeatPassword" type="password" name="repeatPassword" bind:value={repeatPassword} />
    <label for="email">Email</label>
    <input id="email" type="text" name="email" bind:value={email} />
    <button type="submit">Register</button>
    <button onclick={goBack}> Go back </button>
  </form>
</div>

<style>
  .row {
    display: grid;
    justify-content: center;
  }

  h1 {
    text-align: center;
  }
</style>
