<script lang="ts">
  import Router from 'svelte-spa-router'
  import { routes } from '$src/routes'
  import TitleBar from './TitleBar.svelte'
</script>

<TitleBar title="margin" />
<Router {routes} />

<style>
  :global(html, body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
    width: 100%;
    height: 100vh;
  }

  :global(button) {
    padding: 0.6em 1.2em;
    transition: border-color 0.25s;
    cursor: pointer;
  }

  @media (prefers-color-scheme: dark) {
    :global(:root) {
      color: #f6f6f6;
      background-color: #2f2f2f;
    }

    :global(button) {
      color: #ffffff;
      background-color: #0f0f0f98;
    }

    :global(button:active) {
      background-color: #0f0f0f69;
    }
  }
</style>
