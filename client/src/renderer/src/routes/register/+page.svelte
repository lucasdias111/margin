<script lang="ts">
  import { authenticationService } from '$src/services/AuthenticationService'
  import { push } from 'svelte-spa-router'
  import marginLogo from '$src/assets/pics/margin.png'
  import UploadImageButton from '$src/components/common/buttons/UploadImageButton.svelte'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import avatar from '$src/assets/pics/anonym-avatar.png'
  import { errorService } from '$src/services/ErrorService'
  import type { AuthResponse } from '$src/interfaces/AuthResponse'
  import PolicyModal from '$src/components/common/modals/PolicyModal.svelte'
  import { privacyPolicyHtml } from '$src/assets/legal/privacy-policy'
  import { termsOfServiceHtml } from '$src/assets/legal/terms-of-service'
  import Button from '$src/components/common/buttons/Button.svelte'

  let handle = $state('')
  let displayName = $state('')
  let password = $state('')
  let repeatPassword = $state('')
  let email = $state('')
  let profilePicture = $state<File | null>(null)
  let isLoading = $state(false)
  let previewUrl = $state<string | null>(avatar)
  let betaKey = $state('')

  let acceptedTerms = $state(false)
  let acceptedPrivacy = $state(false)

  let policyModalOpen = $state(false)
  let policyModalTitle = $state('')
  let policyModalContent = $state('')

  let registrationComplete = $state(false)
  let registeredEmail = $state('')

  let handleError = $derived(deriveHandleError(handle))
  let passwordError = $derived(derivePasswordError(password))
  let repeatPasswordError = $derived(deriveRepeatPasswordError(password, repeatPassword))

  let handleTouched = $state(false)
  let passwordTouched = $state(false)
  let repeatPasswordTouched = $state(false)
  let policyTouched = $state(false)

  function deriveHandleError(value: string): string | null {
    if (value.length === 0) return null
    if (value.length < 3) return 'Must be at least 3 characters'
    if (value.length > 24) return 'Must be 24 characters or fewer'
    if (!/^[a-zA-Z0-9._-]+$/.test(value))
      return 'Only letters, numbers, dots, hyphens, and underscores'
    if (!/^[a-zA-Z]/.test(value)) return 'Must start with a letter'
    return null
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

  let termsError = $derived(
    policyTouched && !acceptedTerms ? 'You must accept the Terms of Service' : null
  )
  let privacyError = $derived(
    policyTouched && !acceptedPrivacy ? 'You must accept the Privacy Policy' : null
  )

  let hasErrors = $derived(
    !handle ||
      !displayName ||
      !email ||
      !password ||
      !repeatPassword ||
      !acceptedTerms ||
      !acceptedPrivacy ||
      handleError !== null ||
      passwordError !== null ||
      repeatPasswordError !== null
  )

  function sanitizeHandle(event: Event): void {
    const input = event.currentTarget as HTMLInputElement
    input.value = input.value.replace(/\s/g, '')
    handle = input.value
  }

  function openPolicy(type: 'terms' | 'privacy'): void {
    if (type === 'terms') {
      policyModalTitle = 'Terms of Service'
      policyModalContent = termsOfServiceHtml
    } else {
      policyModalTitle = 'Privacy Policy'
      policyModalContent = privacyPolicyHtml
    }
    policyModalOpen = true
  }

  async function handleRegistration(event: SubmitEvent): Promise<void> {
    event.preventDefault()

    handleTouched = true
    passwordTouched = true
    repeatPasswordTouched = true
    policyTouched = true

    if (hasErrors) return

    isLoading = true
    try {
      const response = await authenticationService.register(
        handle,
        displayName,
        password,
        email,
        betaKey,
        profilePicture || undefined
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

<div class="page">
  {#if registrationComplete}
    <div class="card success-card">
      <img src={marginLogo} alt="margin" class="logo" />
      <div class="mail-icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      </div>
      <h1 class="success-title">Check your email</h1>
      <p class="success-body">
        We've sent an activation link to <strong>{registeredEmail}</strong>.
        Click the link in the email to activate your account before signing in.
      </p>
      <p class="success-hint">Didn't get it? Check your spam folder.</p>
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
      <div class="field">
        <label class="label" for="beta-key">Beta key</label>
        <input
          id="beta-key"
          class="input"
          type="text"
          name="betaKey"
          placeholder="MARGIN-BETA-XXXXXXXXXXXX"
          bind:value={betaKey}
          required
          autocomplete="off"
          style="font-family: monospace; letter-spacing: 0.5px;"
        />
      </div>

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
        />
      </div>

      <div class="field">
        <label class="label" for="handle">Handle</label>
        <div class="input-with-badge" class:input-error={handleTouched && handleError}>
          <span class="input-badge">@</span>
          <input
            id="handle"
            class="input input-badged"
            type="text"
            name="handle"
            placeholder="Handle"
            bind:value={handle}
            oninput={sanitizeHandle}
            onblur={() => (handleTouched = true)}
            required
            autocomplete="handle"
          />
        </div>
        {#if handleTouched && handleError}
          <span class="error-text">{handleError}</span>
        {/if}
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
        />
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
          onblur={() => (passwordTouched = true)}
          required
          autocomplete="new-password"
        />
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
          onblur={() => (repeatPasswordTouched = true)}
          required
          autocomplete="new-password"
        />
        {#if repeatPasswordTouched && repeatPasswordError}
          <span class="error-text">{repeatPasswordError}</span>
        {/if}
      </div>

      <div class="legal-checkboxes">
        <label class="checkbox-row">
          <input type="checkbox" bind:checked={acceptedTerms} />
          <span>
            I agree to the
            <button type="button" class="link" onclick={() => openPolicy('terms')}>
              Terms of Service
            </button>
          </span>
        </label>
        {#if termsError}
          <span class="error-text">{termsError}</span>
        {/if}

        <label class="checkbox-row">
          <input type="checkbox" bind:checked={acceptedPrivacy} />
          <span>
            I agree to the
            <button type="button" class="link" onclick={() => openPolicy('privacy')}>
              Privacy Policy
            </button>
          </span>
        </label>
        {#if privacyError}
          <span class="error-text">{privacyError}</span>
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
        <span class="spinner"></span>
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

<PolicyModal
  open={policyModalOpen}
  title={policyModalTitle}
  content={policyModalContent}
  onClose={() => (policyModalOpen = false)}
/>

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

  .input-with-badge {
    display: flex;
    align-items: center;
    height: 42px;
    border-radius: 10px;
    border: 1px solid #ece8e0;
    background: #f7f4ef;
    overflow: hidden;
    transition: border-color 0.15s ease;
    padding-left: 5px;
  }

  .input-with-badge:focus-within {
    border-color: #e8712a;
    background: #ffffff;
  }

  .input-with-badge.input-error {
    border-color: #d94040;
  }

  .input-with-badge.input-error:focus-within {
    border-color: #d94040;
  }

  .input-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 7px;
    background: #ece8e0;
    font-size: 14px;
    font-weight: 600;
    color: #888480;
    flex-shrink: 0;
    user-select: none;
  }

  .input-badged {
    border: none;
    border-radius: 0;
    background: transparent;
    padding-left: 8px;
    height: 100%;
  }

  .input-badged:focus {
    border-color: transparent;
    background: transparent;
  }

  .legal-checkboxes {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 2px 0;
  }

  .checkbox-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #555250;
    cursor: pointer;
  }

  .checkbox-row input[type='checkbox'] {
    width: 16px;
    height: 16px;
    accent-color: #e8712a;
    cursor: pointer;
    flex-shrink: 0;
  }

  .link {
    background: none;
    border: none;
    padding: 0;
    color: #e8712a;
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .link:hover {
    color: #d4621a;
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
