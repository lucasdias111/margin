<script lang="ts">
  import { authenticationService } from '$src/services/AuthenticationService'
  import { push, querystring } from 'svelte-spa-router'
  import { instanceState } from '$src/states/InstanceState.svelte'
  import { inviteCodeFrom } from '$src/services/MarginInviteService'
  import marginLogo from '$src/assets/pics/margin.png'
  import UploadImageButton from '$src/components/common/buttons/UploadImageButton.svelte'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import avatar from '$src/assets/pics/anonym-avatar.png'
  import { errorService } from '$src/services/ErrorService'
  import type { AuthResponse } from '$src/interfaces/AuthResponse'
  import Button from '$src/components/common/buttons/Button.svelte'
  import Tooltip from '$src/components/common/Tooltip.svelte'
  import Spinner from '$src/components/common/Spinner.svelte'
  import PageTransition from '$src/components/common/motion/PageTransition.svelte'

  let displayName = $state('')
  let password = $state('')
  let repeatPassword = $state('')
  let email = $state('')
  let inviteCode = $state(new URLSearchParams($querystring ?? '').get('invite') ?? '')
  const registrationMode = $derived(instanceState.info?.registrationMode ?? 'INVITE')
  // A margin invite link carried over from /invite/<code> needs no separate field.
  const carriedInvite = new URLSearchParams($querystring ?? '').get('invite') !== null
  const needsInviteCode = $derived(registrationMode === 'INVITE' && !carriedInvite)
  let profilePicture = $state<File | null>(null)
  let isLoading = $state(false)
  let previewUrl = $state<string | null>(avatar)

  let registrationComplete = $state(false)
  let registeredEmail = $state('')

  let passwordError = $derived(derivePasswordError(password))
  let repeatPasswordError = $derived(deriveRepeatPasswordError(password, repeatPassword))

  let passwordTouched = $state(false)
  let repeatPasswordTouched = $state(false)
  let focusedField = $state<string | null>(null)

  const fieldHints: Record<string, string> = {
    displayName: 'This is how others see you in Margin. You can change it any time.',
    email: 'Used to sign in and recover your account.',
    inviteCode:
      'Ask an admin of this instance, or someone who invited you, for an invite code or link.',
    password: 'At least 8 characters.',
    repeatPassword: 'Re-enter your password to confirm they match.'
  }

  function derivePasswordError(value: string): string | null {
    if (value.length === 0) return null
    if (value.length < 8) return 'Must be at least 8 characters'
    return null
  }

  function deriveRepeatPasswordError(pw: string, rpw: string): string | null {
    if (rpw.length === 0) return null
    if (pw !== rpw) return "Passwords don't match"
    return null
  }

  let hasErrors = $derived(
    (needsInviteCode && !inviteCode.trim()) ||
      !displayName ||
      !email ||
      !password ||
      !repeatPassword ||
      passwordError !== null ||
      repeatPasswordError !== null
  )

  async function handleRegistration(event: SubmitEvent): Promise<void> {
    event.preventDefault()

    passwordTouched = true
    repeatPasswordTouched = true

    if (hasErrors) return

    isLoading = true
    try {
      const response = await authenticationService.register(
        displayName,
        password,
        email,
        profilePicture || undefined,
        inviteCodeFrom(inviteCode) || undefined
      )

      if (!response.ok) {
        const body: AuthResponse = await response.json()
        errorService.reportError(body.message ?? 'Registration failed.')
        return
      }

      registeredEmail = email
      registrationComplete = true
    } catch (e) {
      errorService.reportError('Failed to connect to server.')
    } finally {
      isLoading = false
    }
  }

  async function onFileChange(file: File): Promise<void> {
    profilePicture = file
  }

  async function onPreviewUrlChange(url: string): Promise<void> {
    previewUrl = url
  }

  function goBack(): void {
    push('/')
  }
</script>

<PageTransition>
  <div class="page">
    {#if registrationComplete}
      <div class="card success-card">
        <img src={marginLogo} alt="margin" class="logo" />
        <div class="mail-icon" aria-hidden="true">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        {#if instanceState.mailEnabled}
          <h1 class="success-title">Check your email</h1>
          <p class="success-body">
            If this instance asks you to confirm your email, we've sent an activation link to
            <strong>{registeredEmail}</strong>. Otherwise you can sign in right away.
          </p>
          <p class="success-hint">Didn't get it? Check your spam folder.</p>
        {:else}
          <h1 class="success-title">Account created</h1>
          <p class="success-body">
            You can sign in now. If this instance needs an admin to approve new accounts, you'll be
            able to sign in once they have.
          </p>
        {/if}
        <Button
          buttonType="primary"
          size="medium"
          text="Back to sign in"
          fullWidth
          onClick={goBack}
        />
      </div>
    {:else if registrationMode === 'CLOSED'}
      <div class="card success-card">
        <img src={marginLogo} alt="margin" class="logo" />
        <h1 class="success-title">Sign-up is closed</h1>
        <p class="success-body">
          Accounts on this instance are created by its admins. Ask one of them to add you.
        </p>
        <Button
          buttonType="primary"
          size="medium"
          text="Back to sign in"
          fullWidth
          onClick={goBack}
        />
      </div>
    {:else}
      <div class="card">
        <img src={marginLogo} alt="margin" class="logo" />

        <div class="avatar-row">
          {#if previewUrl}
            <UserAvatar profilePictureUrl={previewUrl} width={72} height={72} />
          {/if}
          <div class="avatar-meta">
            <p class="avatar-label">Profile picture</p>
            <UploadImageButton {onFileChange} {onPreviewUrlChange} />
          </div>
        </div>

        <form class="form" onsubmit={handleRegistration}>
          {#if needsInviteCode}
            <div class="field">
              <label class="label" for="invite-code">Invite code</label>
              <input
                id="invite-code"
                class="input"
                type="text"
                name="inviteCode"
                placeholder="Invite code or link"
                bind:value={inviteCode}
                required
                autocomplete="off"
                onfocus={() => (focusedField = 'inviteCode')}
                onblur={() => (focusedField = null)}
              />
              <Tooltip open={focusedField === 'inviteCode'} text={fieldHints.inviteCode} />
            </div>
          {/if}

          <div class="field">
            <label class="label" for="display-name">Display name</label>
            <input
              id="display-name"
              class="input"
              type="text"
              name="displayName"
              placeholder="Your Name"
              bind:value={displayName}
              required
              autocomplete="name"
              onfocus={() => (focusedField = 'displayName')}
              onblur={() => (focusedField = null)}
            />
            <Tooltip open={focusedField === 'displayName'} text={fieldHints.displayName} />
          </div>

          <div class="field">
            <label class="label" for="email">Email</label>
            <input
              id="email"
              class="input"
              type="email"
              name="email"
              placeholder="you@example.com"
              bind:value={email}
              required
              autocomplete="email"
              onfocus={() => (focusedField = 'email')}
              onblur={() => (focusedField = null)}
            />
            <Tooltip open={focusedField === 'email'} text={fieldHints.email} />
          </div>

          <div class="field">
            <label class="label" for="password">Password</label>
            <input
              id="password"
              class="input"
              class:input-error={passwordTouched && passwordError}
              type="password"
              name="password"
              placeholder="••••••••"
              bind:value={password}
              onfocus={() => (focusedField = 'password')}
              onblur={() => {
                passwordTouched = true
                focusedField = null
              }}
              required
              autocomplete="new-password"
            />
            <Tooltip open={focusedField === 'password'} text={fieldHints.password} />
            {#if passwordTouched && passwordError}
              <span class="error-text">{passwordError}</span>
            {/if}
          </div>

          <div class="field">
            <label class="label" for="repeatPassword">Confirm password</label>
            <input
              id="repeatPassword"
              class="input"
              class:input-error={repeatPasswordTouched && repeatPasswordError}
              type="password"
              name="repeatPassword"
              placeholder="••••••••"
              bind:value={repeatPassword}
              onfocus={() => (focusedField = 'repeatPassword')}
              onblur={() => {
                repeatPasswordTouched = true
                focusedField = null
              }}
              required
              autocomplete="new-password"
            />
            <Tooltip open={focusedField === 'repeatPassword'} text={fieldHints.repeatPassword} />
            {#if repeatPasswordTouched && repeatPasswordError}
              <span class="error-text">{repeatPasswordError}</span>
            {/if}
          </div>

          <Button
            buttonType="primary"
            size="medium"
            text="Create account"
            fullWidth
            onClick={handleRegistration}
          />
          {#if isLoading}
            <Spinner size={16} color="#ffffff" />
          {/if}
        </form>

        <div class="divider">
          <span>or</span>
        </div>

        <Button
          buttonType="secondary"
          size="medium"
          text="Back to sign in"
          fullWidth
          onClick={goBack}
        />
      </div>
    {/if}
  </div>
</PageTransition>

<style>
  .page {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #e5e1db;
    padding: 24px;
    box-sizing: border-box;
    overflow-y: auto;
  }

  .card {
    background: #ffffff;
    border: 1px solid #ece8e0;
    border-radius: 20px;
    padding: 36px 32px;
    width: 100%;
    max-width: 360px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-sizing: border-box;
  }

  .logo {
    width: 100px;
    height: auto;
    display: block;
    align-self: center;
  }

  .avatar-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px;
    background: #f7f4ef;
    border-radius: 12px;
    border: 1px solid #ece8e0;
  }

  .avatar-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .avatar-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #888480;
    margin: 0;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .field {
    position: relative;
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

  .input-error {
    border-color: #d94040;
  }

  .input-error:focus {
    border-color: #d94040;
  }

  .error-text {
    font-size: 12px;
    color: #d94040;
    margin: 0;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
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

  .success-card {
    align-items: center;
    text-align: center;
    gap: 16px;
  }

  .mail-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #fdf0e8;
    color: #e8712a;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 4px;
  }

  .success-title {
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
    letter-spacing: -0.2px;
  }

  .success-body {
    font-size: 14px;
    line-height: 1.55;
    color: #555250;
    margin: 0;
  }

  .success-body strong {
    color: #1a1a1a;
    font-weight: 600;
    word-break: break-all;
  }

  .success-hint {
    font-size: 12px;
    color: #888480;
    margin: -4px 0 4px 0;
  }
</style>
