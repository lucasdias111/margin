<script lang="ts">
  import { onMount } from 'svelte'
  import { push, querystring } from 'svelte-spa-router'
  import AuthCard from '$src/components/authentication/AuthCard.svelte'
  import Button from '$src/components/common/buttons/Button.svelte'
  import Spinner from '$src/components/common/Spinner.svelte'
  import PageTransition from '$src/components/common/motion/PageTransition.svelte'
  import { authenticationService } from '$src/services/AuthenticationService'
  import { passwordProblem } from '$src/utils/passwordRules'

  type Phase = 'checking' | 'form' | 'invalid'

  const token = $derived(new URLSearchParams($querystring ?? '').get('token') ?? '')

  let phase = $state<Phase>('checking')
  let displayName = $state('')
  let email = $state('')
  let password = $state('')
  let repeatPassword = $state('')
  let errorMessage = $state('')
  let isLoading = $state(false)

  onMount(async () => {
    phase = token && (await authenticationService.isSetupTokenValid(token)) ? 'form' : 'invalid'
  })

  async function handleSubmit(event: Event): Promise<void> {
    event.preventDefault()
    errorMessage = passwordProblem(password, repeatPassword) ?? ''
    if (!displayName.trim() || !email.trim()) errorMessage = 'Fill in every field.'
    if (errorMessage) return

    isLoading = true
    try {
      if (
        !(await authenticationService.completeSetup(token, displayName.trim(), email, password))
      ) {
        errorMessage = 'Setup failed. The link may already have been used.'
        return
      }
      await authenticationService.login(email, password)
      await push('/home')
    } catch {
      errorMessage = 'Your account was created, but signing in failed. Try signing in.'
    } finally {
      isLoading = false
    }
  }
</script>

<PageTransition>
  {#if phase === 'checking'}
    <AuthCard title="Set up margin">
      <p class="auth-text">Checking your setup link…</p>
    </AuthCard>
  {:else if phase === 'invalid'}
    <AuthCard title="Setup link not valid">
      <p class="auth-text">
        This setup link has expired or was already used. On the server, run
        <code>docker compose exec margin-server margin setup-link</code> to print a fresh one.
      </p>
      <Button
        buttonType="secondary"
        size="medium"
        text="Go to sign in"
        fullWidth
        onClick={() => push('/')}
      />
    </AuthCard>
  {:else}
    <AuthCard
      title="Set up margin"
      subtitle="Create the first admin account for this instance. You can invite everyone else afterwards."
    >
      <form class="auth-form" onsubmit={handleSubmit}>
        <div class="auth-field">
          <label class="auth-label" for="setup-name">Display name</label>
          <input
            id="setup-name"
            class="auth-input"
            bind:value={displayName}
            autocomplete="name"
            required
          />
        </div>
        <div class="auth-field">
          <label class="auth-label" for="setup-email">Email</label>
          <input
            id="setup-email"
            class="auth-input"
            type="email"
            bind:value={email}
            autocomplete="email"
            required
          />
        </div>
        <div class="auth-field">
          <label class="auth-label" for="setup-password">Password</label>
          <input
            id="setup-password"
            class="auth-input"
            type="password"
            bind:value={password}
            autocomplete="new-password"
            required
          />
        </div>
        <div class="auth-field">
          <label class="auth-label" for="setup-repeat">Confirm password</label>
          <input
            id="setup-repeat"
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
          text="Create admin account"
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

<style>
  code {
    font-size: 12px;
    background: #f7f4ef;
    padding: 1px 5px;
    border-radius: 4px;
  }
</style>
