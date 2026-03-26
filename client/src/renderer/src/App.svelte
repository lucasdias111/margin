<script lang="ts">
  import Router from 'svelte-spa-router'
  import { routes } from '$src/routes'
  import TitleBar from './TitleBar.svelte'
  import ErrorBar from '$src/components/common/errors/ErrorBar.svelte'
</script>

<div class="app-shell">
  <TitleBar title="margin" />
  <ErrorBar />
  <div class="app-content">
    <Router {routes} />
  </div>
</div>

<style>
  .app-shell {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  .app-content {
    flex: 1;
    min-height: 0;
    display: flex;
  }
</style>
