<script lang="ts">
  import { onMount } from 'svelte'
  import Router from 'svelte-spa-router'
  import { routes } from '$src/routes'
  import ErrorToast from '$src/components/common/messages/ErrorToast.svelte'
  import { instanceService } from '$src/services/InstanceService'
  import { desktopBridge } from '$src/services/DesktopBridge'

  onMount(() => {
    instanceService.load()
    desktopBridge.start()
  })
</script>

<div class="app-shell">
  <ErrorToast />
  <div class="app-content">
    <Router {routes} />
  </div>
</div>

<style>
  .app-shell {
    display: flex;
    flex-direction: column;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
  }

  .app-content {
    flex: 1;
    min-height: 0;
    display: flex;
  }
</style>
