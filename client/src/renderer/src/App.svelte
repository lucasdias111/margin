<script lang="ts">
  import Router from 'svelte-spa-router'
  import { routes } from '$src/routes'
  import TitleBar from './TitleBar.svelte'
  import ErrorToast from '$src/components/common/messages/ErrorToast.svelte'
  import UpgradeModal from '$src/components/common/modals/UpgradeModal.svelte'
  import { isElectron } from '$src/utils/platformUtils'
</script>

<div class="app-shell">
  {#if isElectron()}
    <TitleBar title="margin" />
  {/if}
  <ErrorToast />
  <UpgradeModal />
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
