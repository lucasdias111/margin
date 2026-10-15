<script lang="ts">
  import Router from 'svelte-spa-router'
  import { routes } from '$src/routes'
  import TitleBar from './TitleBar.svelte'
  import ErrorToast from '$src/components/common/messages/ErrorToast.svelte'
  import { isElectron } from '$src/utils/platformUtils'

  const rounded = window.api?.platform !== 'linux'
</script>

<div class="app-shell" class:rounded>
  {#if isElectron()}
    <TitleBar title="margin" />
  {/if}
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

  .app-shell.rounded {
    border-radius: 14px;
    background: #f2eee8;
  }

  @media (prefers-color-scheme: dark) {
    .app-shell.rounded {
      background: #2d2d2d;
    }
  }

  .app-content {
    flex: 1;
    min-height: 0;
    display: flex;
  }
</style>
