<script lang="ts">
  import Login from '$src/components/authentication/Login.svelte'
  import marginLogo from '$src/assets/pics/margin.png'
  import { onMount } from 'svelte'
  import { push } from 'svelte-spa-router'
  import { authenticationService } from '$src/services/AuthenticationService'

  onMount(async () => {
    const restored = await authenticationService.tryRestoreSession()
    if (restored) {
      await push('/home')
    }
  })
</script>

<div class="container">
  <img class="marginlogo" src={marginLogo} alt="Margin logo" />
  <Login />
</div>

<style>
  .container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    padding-top: 15vh;
    align-items: center;
    background-color: whitesmoke;
    gap: 40px;
  }

  .marginlogo {
    display: flex;
    justify-content: center;
    width: 220px;
    height: auto;
  }
</style>
