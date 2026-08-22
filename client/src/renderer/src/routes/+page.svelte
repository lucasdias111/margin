<script lang="ts">
  import Login from '$src/components/authentication/Login.svelte'
  import marginLogo from '$src/assets/pics/margin.png'
  import { onMount } from 'svelte'
  import { push } from 'svelte-spa-router'
  import { authenticationService } from '$src/services/AuthenticationService'
  import PageTransition from '$src/components/common/motion/PageTransition.svelte'

  onMount(async () => {
    const restored = await authenticationService.tryRestoreSession()
    if (restored) {
      await push('/home')
    }
  })
</script>

<PageTransition>
  <div class="container">
    <img class="marginlogo" src={marginLogo} alt="Margin logo" />
    <Login />
  </div>
</PageTransition>

<style>
  .container {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    padding-top: 50px;
    align-items: center;
    background-color: #f2eee8;
  }

  .marginlogo {
    display: flex;
    justify-content: center;
    width: 220px;
    height: auto;
  }
</style>
