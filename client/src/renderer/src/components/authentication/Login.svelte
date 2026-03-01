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

<div class="loginpage">
  <form class="formWrap" onsubmit={handleLogin}>
    <input
      class="loginInput"
      type="text"
      name="username"
      placeholder="Username"
      bind:value={username}
    />

    <input
      class="loginInput"
      type="password"
      name="password"
      placeholder="Password"
      bind:value={password}
    />
    <button class="logbut" type="submit">Login</button>
  </form>

  <p class="or">or</p>

  <button class="regbut" onclick={goToRegister}>Register</button>
  <p class="response">{loginResponse}</p>
</div>

<style>
  .loginpage {
    min-height: 100vh;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-direction: column;
    background-color: whitesmoke;
    padding: 0px;
    margin-bottom: 15px;
  }

  .formWrap {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 280px;
  }

  .loginInput {
    height: 40px;
    width: 100%;
    border-radius: 10px;
    border: 1px solid black;
    outline: none;
    padding: 0 12px;
    font-size: 14px;
    box-sizing: border-box;
    border-color: #4e4d4d;
  }

  .logbut {
    background-color: #f47e3a;
    width: 100%;
    border-radius: 10px;
    border: none;
    flex-direction: column;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 12px;
    color: whitesmoke;
    cursor: pointer;
  }

  .response {
    color: black;
  }

  .regbut {
    background-color: #f47e3a;
    width: 100%;
    border-radius: 10px;
    border: none;
    padding: 8px;
    flex-direction: column;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 12px;
    color: whitesmoke;
    cursor: pointer;
  }

  .logbut:hover,
  .regbut:hover {
    opacity: 0.9;
  }

  p {
    text-align: center;
    margin: 0;
  }

  .or {
    color: black;
    margin: 8px 0;
    font-size: 14px;
  }
</style>
