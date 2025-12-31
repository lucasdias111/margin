<script lang="ts">
  import LoginComponent from '$src/components/authentication/Login.svelte'
</script>

<div class="container">
  <h1>margin</h1>
  <LoginComponent />
</div>

<style>
  .container {
    margin: 0;
    padding-top: 10vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: center;
  }
</style>
