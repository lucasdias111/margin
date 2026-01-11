<script lang="ts">
  import { push } from 'svelte-spa-router'

  function logout(): void {
    push('/')
  }
</script>

<div>
  <button onclick={logout}>Log out</button>
</div>
