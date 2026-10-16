<script lang="ts">
  import { push } from 'svelte-spa-router'
  import AuthCard from '$src/components/authentication/AuthCard.svelte'
  import Button from '$src/components/common/buttons/Button.svelte'
  import Spinner from '$src/components/common/Spinner.svelte'
  import PageTransition from '$src/components/common/motion/PageTransition.svelte'
  import { authenticationService } from '$src/services/AuthenticationService'
  import { passwordProblem } from '$src/utils/passwordRules'

  const { params }: { params?: { token?: string } } = $props()

  let password = $state('')
  let repeatPassword = $state('')
  let errorMessage = $state('')
  let isLoading = $state(false)
  let done = $state(false)

  async function handleSubmit(event: Event): Promise<void> {
    event.preventDefault()
    errorMessage = passwordProblem(password, repeatPassword) ?? ''
    if (errorMessage) return

    isLoading = true
    const failure = await authenticationService.resetPassword(params?.token ?? '', password)
    isLoading = false
    if (failure) {
      errorMessage = failure
      return
    }
    done = true
  }
</script>

<PageTransition>
  {#if done}
    <AuthCard title="Password set" subtitle="You can sign in with your new password now.">
      <Button
        buttonType="primary"
        size="medium"
        text="Sign in"
        fullWidth
        onClick={() => push('/')}
      />
    </AuthCard>
  {:else}
    <AuthCard
      title="Choose a new password"
      subtitle="Messages are end-to-end encrypted with a key tied to your password, so after a reset your earlier encrypted messages can no longer be read."
    >
      <form class="auth-form" onsubmit={handleSubmit}>
        <div class="auth-field">
          <label class="auth-label" for="reset-password">New password</label>
          <input
            id="reset-password"
            class="auth-input"
            type="password"
            bind:value={password}
            autocomplete="new-password"
            required
          />
        </div>
        <div class="auth-field">
          <label class="auth-label" for="reset-repeat">Confirm password</label>
          <input
            id="reset-repeat"
            class="auth-input"
            type="password"
            bind:value={repeatPassword}
            autocomplete="new-password"
            required
          />
        </div>
        {#if errorMessage}
          <p class="auth-error">{errorMessage}</p>
        {/if}
        <Button
          buttonType="primary"
          size="medium"
          text="Set password"
          fullWidth
          disabled={isLoading}
          onClick={handleSubmit}
        />
        {#if isLoading}
          <Spinner size={16} color="#ffffff" />
        {/if}
      </form>
    </AuthCard>
  {/if}
</PageTransition>
