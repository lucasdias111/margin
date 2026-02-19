<script lang="ts">
  import { authenticationService } from '$src/services/AuthenticationService'
  import { push } from 'svelte-spa-router'
  import marginLogo from '$src/assets/pics/margin-lo.png'

  let username = $state('')
  let password = $state('')
  let repeatPassword = $state('')
  let email = $state('')
  let profilePicture = $state<File | null>(null)
  let loginResponse = $state('')
  let previewUrl = $state<string | null>(null)

  async function handleRegistration(event: SubmitEvent): Promise<void> {
    event.preventDefault()

    if (password !== repeatPassword) {
      loginResponse = 'Passwords do not match'
      return
    }

    await authenticationService.register(username, password, email, profilePicture || undefined)
    push('/')
  }

  function handleFileChange(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (file) {
      profilePicture = file

      const reader = new FileReader()
      reader.onload = (e) => {
        previewUrl = e.target?.result as string
      }
      reader.readAsDataURL(file)
    } else {
      profilePicture = null
      previewUrl = null
    }
  }

  function goBack(): void {
    push('/')
  }
</script>

<div>
  <form class="row" onsubmit={handleRegistration}>
    <img class="marginlogo" src={marginLogo} alt="Margin logo" />
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
    <input
      id="profilePicture"
      type="file"
      name="profilePicture"
      accept="image/*"
      onchange={handleFileChange}
      hidden
      placeholder="Profile Picture (Optional)"
    />
    <label for="ProfilePicture" class="upload">Profile picture (Optional):</label>
    <label for="profilePicture" class="fileUpload">
      {profilePicture ? profilePicture.name : 'Upload'}
    </label>

    {#if previewUrl}
      <div class="preview">
        <img src={previewUrl} alt="Profile preview" />
      </div>
    {/if}

    {#if loginResponse}
      <p class="error">{loginResponse}</p>
    {/if}

    <button class="register" type="submit">Register</button>
  </form>
  <button id="backbut" onclick={goBack} aria-label="Back" title="Back">
    <svg width="12px" height="12px" viewBox="0 0 1024 1024" fill="#da6b10">
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
  div {
    background-color: whitesmoke;
    height: 100vh;
    padding: 10px;
  }

  input {
    height: 40px;
    width: 20%;
    border-radius: 10px;
    border: 1px solid black;
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
    margin: 10px 0;
  }

  .preview img {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #ccc;
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

  .upload {
    color: rgb(81, 26, 26);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  .fileUpload {
    height: 40px;
    border-radius: 10px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    border: 2px solid #4e4d4d;
    display: flex;
    align-items: center;
    padding: 0 12px;
    font-size: 14px;
    cursor: pointer;
    background-color: rgb(255, 255, 255);
    color: #662929;
  }
</style>
