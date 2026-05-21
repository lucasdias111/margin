<script lang="ts">
  import { authenticationService } from '$src/services/AuthenticationService'
  import { push } from 'svelte-spa-router'
  import { onMount } from 'svelte'
  import Button from '$src/components/common/buttons/Button.svelte'

  const REMEMBERED_EMAIL_KEY = 'margin_remembered_email'

  let email = $state('')
  let password = $state('')
  let loginResponse = $state('')
  let rememberMe = $state(false)
  let keepLoggedIn = $state(false)
  let isLoading = $state(false)
  let hasError = $state(false)

  onMount(() => {
    const saved = localStorage.getItem(REMEMBERED_EMAIL_KEY)
    if (saved) {
      email = saved
      rememberMe = true
    }
  })

  async function handleLogin(event: SubmitEvent): Promise<void> {
    event.preventDefault()
    isLoading = true
    hasError = false

    if (rememberMe) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, email)
    } else {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY)
    }

    try {
      await authenticationService.login(email, password, keepLoggedIn)
      await push('/home')
    } catch (e: unknown) {
      hasError = true
      const message = e instanceof Error ? e.message : ''
      if (/not yet activated/i.test(message)) {
        loginResponse =
          'Please activate your account first — we sent an activation link to your email.'
      } else {
        loginResponse = 'Invalid email or password'
      }
    } finally {
      isLoading = false
    }
  }

  function goToRegister(): void {
    push('/register')
  }

  function goToForgotPassword(): void {
    push('/forgot-password')
  }
</script>

<div class="page">
  <div class="card">
    <div class="header">
      <h1 class="title">Welcome back</h1>
    </div>

    <form class="form" onsubmit={handleLogin}>
      <div class="field">
        <label class="label" for="email">Email</label>
        <input
          id="email"
          class="input"
          type="email"
          name="email"
          placeholder="you@example.com"
          bind:value={email}
          autocomplete="email"
        />
      </div>

      <div class="field">
        <label class="label" for="password">Password</label>
        <input
          id="password"
          class="input"
          type="password"
          name="password"
          placeholder="••••••••"
          bind:value={password}
          autocomplete="current-password"
        />
      </div>

      <div class="forgot-row">
        <button class="forgot-link" type="button" onclick={goToForgotPassword}>Forgot password?</button>
      </div>

      <div class="checkboxes">
        <label class="check">
          <input type="checkbox" bind:checked={rememberMe} />
          <span class="checkmark"></span>
          Remember email
        </label>
        <label class="check">
          <input type="checkbox" bind:checked={keepLoggedIn} />
          <span class="checkmark"></span>
          Keep me logged in
        </label>
      </div>

      {#if hasError}
        <p class="error">{loginResponse}</p>
      {/if}

      <Button
        buttonType="primary"
        size="medium"
        text="Sign in"
        onClick={handleLogin}
        disabled={isLoading}
        fullWidth
      />
      {#if isLoading}
        <span class="spinner"></span>
      {/if}
    </form>

    <div class="divider">
      <span>or</span>
    </div>
    <Button
      buttonType="secondary"
      onClick={goToRegister}
      size="medium"
      text="Create an account"
      fullWidth
    />
  </div>
</div>

<style>
  .page {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f2eee8;
    padding: 50px;
    flex: 1;
  }

  .card {
    background: #ffffff;
    border: 1px solid #ece8e0;
    border-radius: 20px;
    padding: 40px 36px;
    width: 100%;
    max-width: 380px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .header {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .title {
    font-size: 22px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
    letter-spacing: -0.3px;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #888480;
  }

  .input {
    height: 42px;
    width: 100%;
    border-radius: 10px;
    border: 1px solid #ece8e0;
    background: #f7f4ef;
    outline: none;
    padding: 0 14px;
    font-size: 14px;
    color: #1a1a1a;
    box-sizing: border-box;
    transition: border-color 0.15s ease;
    font-family: inherit;
  }

  .input:focus {
    border-color: #e8712a;
    background: #ffffff;
  }

  .input::placeholder {
    color: #c4bfb8;
  }

  .checkboxes {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .check {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #555250;
    cursor: pointer;
    user-select: none;
    position: relative;
  }

  .check input[type='checkbox'] {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .checkmark {
    width: 16px;
    height: 16px;
    min-width: 16px;
    border-radius: 4px;
    border: 1.5px solid #ece8e0;
    background: #f7f4ef;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .check input[type='checkbox']:checked + .checkmark {
    background: #e8712a;
    border-color: #e8712a;
  }

  .check input[type='checkbox']:checked + .checkmark::after {
    content: '';
    display: block;
    width: 4px;
    height: 7px;
    border: 1.5px solid white;
    border-top: none;
    border-left: none;
    transform: rotate(45deg) translateY(-1px);
  }

  .error {
    font-size: 13px;
    color: #d4621a;
    margin: 0;
    padding: 10px 14px;
    background: #fdf0e8;
    border-radius: 8px;
    border: 1px solid #f5d5be;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .forgot-row {
    display: flex;
    justify-content: flex-end;
    margin-top: -4px;
  }

  .forgot-link {
    background: none;
    border: none;
    padding: 0;
    font-size: 12px;
    color: #888480;
    cursor: pointer;
    font-family: inherit;
    text-decoration: underline;
  }

  .forgot-link:hover {
    color: #1a1a1a;
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #c4bfb8;
    font-size: 12px;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #ece8e0;
  }
</style>
