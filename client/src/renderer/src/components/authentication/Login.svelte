<script lang="ts">
  import { authenticationService } from '$src/services/AuthenticationService'
  import { push } from 'svelte-spa-router'

  let email = $state('')
  let password = $state('')
  let loginResponse = $state('')
  let rememberMe = $state(false)

  async function handleLogin(event: SubmitEvent): Promise<void> {
    event.preventDefault()

    await authenticationService.login(email, password, rememberMe)
    loginResponse = 'Login successful'
    await push('/home')
  }

  function goToRegister(): void {
    push('/register')
  }
</script>

<div class="loginpage">
  <form class="formWrap" onsubmit={handleLogin}>
    <input class="loginInput" type="email" name="email" placeholder="Email" bind:value={email} />

    <input
      class="loginInput"
      type="password"
      name="password"
      placeholder="Password"
      bind:value={password}
    />

    <label class="rememberMe">
      <input type="checkbox" bind:checked={rememberMe} />
      Remember me
    </label>

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
    padding: 0;
    margin-bottom: 15px;
  }

  .rememberMe {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #4e4d4d;
    cursor: pointer;
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
