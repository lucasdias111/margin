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
    border-radius: 8px;
    border: 1px solid transparent;
    padding: 0.6em 1.2em;
    font-size: 1em;
    font-weight: 500;
    font-family: inherit;
    color: #0f0f0f;
    background-color: #ffffff;
    transition: border-color 0.25s;
    box-shadow: 0 2px 2px rgba(0, 0, 0, 0.2);
    cursor: pointer;
  }

  :global(button:hover) {
    border-color: #396cd8;
  }

  :global(button:active) {
    border-color: #396cd8;
    background-color: #e8e8e8;
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
