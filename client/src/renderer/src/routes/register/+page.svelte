<script lang="ts">
  import { authenticationService } from '$src/services/AuthenticationService'
  import { push } from 'svelte-spa-router'

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
  <h1>Register</h1>
  <form class="row" onsubmit={handleRegistration}>
    <label for="username">Username</label>
    <input id="username" type="text" name="username" bind:value={username} required />

    <label for="email">Email</label>
    <input id="email" type="email" name="email" bind:value={email} required />

    <label for="password">Password</label>
    <input id="password" type="password" name="password" bind:value={password} required />

    <label for="repeatPassword">Repeat password</label>
    <input id="repeatPassword" type="password" name="repeatPassword" bind:value={repeatPassword} required />

    <label for="profilePicture">Profile Picture (optional)</label>
    <input
      id="profilePicture"
      type="file"
      name="profilePicture"
      accept="image/*"
      onchange={handleFileChange}
    />

    {#if previewUrl}
      <div class="preview">
        <img src={previewUrl} alt="Profile preview" />
      </div>
    {/if}

    {#if loginResponse}
      <p class="error">{loginResponse}</p>
    {/if}

    <button type="submit">Register</button>
  </form>
  <button id="backbut" onclick={goBack}> ←</button>
</div>

<style>
  .row {
    display: grid;
    justify-content: center;
    gap: 10px;
  }

  #backbut {
    position: fixed;
    top: 50px;
    left: 10px;
    padding: 10px;
  }

  h1 {
    text-align: center;
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

  input[type="file"] {
    padding: 5px;
  }
</style>
