<script lang="ts">
  import Router from 'svelte-spa-router'
  import { routes } from '$src/routes'
  import TitleBar from './TitleBar.svelte'
  import ErrorBar from '$src/components/common/errors/ErrorBar.svelte'
</script>

<TitleBar title="margin" />
<ErrorBar />
<Router {routes} />
