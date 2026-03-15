<script lang="ts">
  import { authenticationService } from '$src/services/AuthenticationService'
  import { push } from 'svelte-spa-router'
  import marginLogo from '$src/assets/pics/margin.png'
  import UploadImageButton from '$src/components/common/buttons/UploadImageButton.svelte'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import avatar from '$src/assets/pics/anonym-avatar.png'
  import { errorService } from '$src/services/ErrorService'

  let username = $state('')
  let password = $state('')
  let repeatPassword = $state('')
  let email = $state('')
  let profilePicture = $state<File | null>(null)
  let isLoading = $state(false)
  let previewUrl = $state<string | null>(avatar)

  async function handleRegistration(event: SubmitEvent): Promise<void> {
    event.preventDefault()

    if (password !== repeatPassword) {
      errorService.reportError(`Passwords don't match.`)
      return
    }

    isLoading = true
    try {
      await authenticationService.register(username, password, email, profilePicture || undefined)
      await push('/')

      {
        errorService.reportError('Failed to register.')
        return
      }
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
  <div class="card">
    <img src={marginLogo} alt="Margin" class="logo" />

    <div class="header">
      <h1 class="title">Create account</h1>
    </div>

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
        <label class="label" for="username">Username</label>
        <input
          id="username"
          class="input"
          type="text"
          name="username"
          placeholder="Your name"
          bind:value={username}
          required
          autocomplete="username"
        />
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
          type="password"
          name="password"
          placeholder="••••••••"
          bind:value={password}
          required
          autocomplete="new-password"
        />
      </div>

      <div class="field">
        <label class="label" for="repeatPassword">Confirm password</label>
        <input
          id="repeatPassword"
          class="input"
          type="password"
          name="repeatPassword"
          placeholder="••••••••"
          bind:value={repeatPassword}
          required
          autocomplete="new-password"
        />
      </div>

      <button class="btn-primary" type="submit" disabled={isLoading}>
        {#if isLoading}
          <span class="spinner"></span>
        {:else}
          Create account
        {/if}
      </button>
    </form>

    <div class="divider">
      <span>or</span>
    </div>

    <button class="btn-secondary" onclick={goBack}> Back to sign in </button>
  </div>
</div>

<style>
  .page {
    min-height: 100vh;
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
    width: 160px;
    height: auto;
    display: block;
    align-self: center;
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

  .btn-primary {
    height: 42px;
    width: 100%;
    background: #e8712a;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    letter-spacing: 0.1px;
  }

  .btn-primary:hover:not(:disabled) {
    background: #d4621a;
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  #backbut {
    position: fixed;
    border-radius: 999px;
    top: 50px;
    left: 10px;
    padding: 5px;
    background-color: #f47e3a;
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

  .btn-secondary {
    height: 42px;
    width: 100%;
    background: transparent;
    color: #555250;
    border: 1px solid #ece8e0;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s ease;
  }

  .btn-secondary:hover {
    border-color: #e8712a;
    color: #e8712a;
  }
</style>
