<script lang="ts">
  import LoginComponent from '$src/components/authentication/Login.svelte'
  import marginLogo from '$src/assets/pics/margin-lo.png'
</script>

<div class="container">
  <img class="marginlogo" src={marginLogo} alt="Margin logo" />
  <LoginComponent />
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
    width: 220px;
    height: auto;
  }
</style>
