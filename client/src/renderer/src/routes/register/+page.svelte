<script lang="ts">
  import { authenticationService } from '$src/services/AuthenticationService'
  import { push } from 'svelte-spa-router'
  import marginLogo from '$src/assets/pics/margin.png'
  import UploadImageButton from '$src/components/common/buttons/UploadImageButton.svelte'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import avatar from '$src/assets/pics/anonym-avatar.png'

  let username = $state('')
  let password = $state('')
  let repeatPassword = $state('')
  let email = $state('')
  let profilePicture = $state<File | null>(null)
  let loginResponse = $state('')
  let previewUrl = $state<string | null>(avatar)

  async function handleRegistration(event: SubmitEvent): Promise<void> {
    event.preventDefault()

    if (password !== repeatPassword) {
      loginResponse = 'Passwords do not match'
      return
    }

    await authenticationService.register(username, password, email, profilePicture || undefined)
    await push('/')
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
  <form class="row" onsubmit={handleRegistration}>
    <img class="marginlogo" src={marginLogo} alt="Margin logo" />

    {#if previewUrl}
      <UserAvatar profilePictureUrl={previewUrl} width={100} height={100} />
    {/if}
    <input
      id="username"
      type="text"
      name="username"
      bind:value={username}
      required
      placeholder="Username"
    />
    <input id="email" type="email" name="email" bind:value={email} required placeholder="Email" />
    <input
      id="password"
      type="password"
      name="password"
      bind:value={password}
      required
      placeholder="Password"
    />
    <input
      id="repeatPassword"
      type="password"
      name="repeatPassword"
      bind:value={repeatPassword}
      required
      placeholder="Repeat password"
    />
    <UploadImageButton {onFileChange} {onPreviewUrlChange} />

    {#if loginResponse}
      <p class="error">{loginResponse}</p>
    {/if}
    <button class="register" type="submit">Register</button>
  </form>
  <button id="backbut" onclick={goBack} aria-label="Back" title="Back">
    <svg width="12px" height="12px" viewBox="0 0 1024 1024" fill="#f47e3a">
      <path
        d="M669.6 849.6c8.8 8 22.4
            7.2 30.4-1.6s7.2-22.4-1.6-30.4l-309.6-280c-8-7.2-8-17.6
            0-24.8l309.6-270.4c8.8-8 9.6-21.6
            2.4-30.4-8-8.8-21.6-9.6-30.4-2.4L360.8
            480.8c-27.2 24-28 64-0.8 88.8l309.6 280z"
        fill="#ffffff"
      />
    </svg>
  </button>
</div>

<style>
  .page {
    background-color: whitesmoke;
    min-height: 100vh;
    padding: 10px;
  }

  input {
    height: 40px;
    width: 20%;
    border-radius: 10px;
    outline: none;
    padding: 0 12px;
    font-size: 14px;
    box-sizing: border-box;
    border-color: #4e4d4d;
  }
  .row {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 18px;
    margin-top: 120px;
    min-height: 500px;
  }

  #backbut {
    position: fixed;
    border-radius: 999px;
    top: 50px;
    left: 10px;
    padding: 5px;
    background-color: #da610b;
  }

  .preview {
    display: flex;
    justify-content: center;
    margin: 10px 0 5px 0;
  }

  .preview img {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #ccc;
  }

  .error {
    color: red;
    text-align: center;
  }

  input[type='file'] {
    padding: 5px;
  }

  .register {
    background-color: #da610b;
  }

  .marginlogo {
    width: 220px;
    height: auto;
  }
</style>
