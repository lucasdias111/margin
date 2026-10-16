<script lang="ts">
  import { push } from 'svelte-spa-router'
  import { authenticationService } from '$src/services/AuthenticationService'
  import Button from '$src/components/common/buttons/Button.svelte'
  import Spinner from '$src/components/common/Spinner.svelte'
  import { instanceState } from '$src/states/InstanceState.svelte'

  let email = $state('')
  let isLoading = $state(false)
  let submitted = $state(false)
  let errorMessage = $state('')

  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault()
    isLoading = true
    errorMessage = ''

    try {
      await authenticationService.forgotPassword(email)
      submitted = true
    } catch {
      errorMessage = 'Something went wrong. Please try again.'
    } finally {
      isLoading = false
    }
  }
</script>

<div class="page">
  <div class="card">
    {#if instanceState.info && !instanceState.mailEnabled}
      <div class="header">
        <h1 class="title">Forgot password?</h1>
        <p class="subtitle">
          This instance doesn't send email. Contact your admin: they can give you a link to set a
          new password.
        </p>
      </div>
      <Button
        buttonType="secondary"
        size="medium"
        text="Back to sign in"
        onClick={() => push('/')}
        fullWidth
      />
    {:else if submitted}
      <div class="header">
        <h1 class="title">Check your email</h1>
        <p class="subtitle">
          If an account exists for <strong>{email}</strong>, we've sent a password reset link.
        </p>
      </div>
      <Button
        buttonType="secondary"
        size="medium"
        text="Back to sign in"
        onClick={() => push('/')}
        fullWidth
      />
    {:else}
      <div class="header">
        <h1 class="title">Forgot password?</h1>
        <p class="subtitle">Enter your email and we'll send you a reset link.</p>
      </div>

      <form class="form" onsubmit={handleSubmit}>
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
            required
          />
        </div>

        {#if errorMessage}
          <p class="error">{errorMessage}</p>
        {/if}

        <Button
          buttonType="primary"
          size="medium"
          text="Send reset link"
          onClick={handleSubmit}
          disabled={isLoading}
          fullWidth
        />
        {#if isLoading}
          <Spinner size={16} color="#ffffff" />
        {/if}
      </form>

      <button class="back-link" onclick={() => push('/')}>Back to sign in</button>
    {/if}
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
    gap: 8px;
  }

  .title {
    font-size: 22px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
    letter-spacing: -0.3px;
  }

  .subtitle {
    font-size: 13px;
    color: #888480;
    margin: 0;
    line-height: 1.5;
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

  .error {
    font-size: 13px;
    color: #d4621a;
    margin: 0;
    padding: 10px 14px;
    background: #fdf0e8;
    border-radius: 8px;
    border: 1px solid #f5d5be;
  }

  .back-link {
    background: none;
    border: none;
    padding: 0;
    font-size: 13px;
    color: #888480;
    cursor: pointer;
    text-align: center;
    text-decoration: underline;
    font-family: inherit;
  }

  .back-link:hover {
    color: #1a1a1a;
  }
</style>
