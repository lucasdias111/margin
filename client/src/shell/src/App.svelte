<script lang="ts">
  import { onMount } from 'svelte'
  import type { ShellState } from '../../common/shell'
  import TabBar from './components/TabBar.svelte'
  import AddServer from './components/AddServer.svelte'
  import Settings from './components/Settings.svelte'
  import Offline from './components/Offline.svelte'
  import Picker from './components/Picker.svelte'

  let shellState = $state<ShellState | null>(null)
  let screen = $state<'tabs' | 'add' | 'settings'>('tabs')

  onMount(() => {
    window.shell.onState((next) => (shellState = next))
    void window.shell.getState().then((initial) => {
      shellState ??= initial
    })
  })

  const active = $derived(shellState?.tabs.find((tab) => tab.id === shellState?.activeId) ?? null)
  // With no servers yet, or a link for a server that isn't added, the add screen is the page.
  const showAdd = $derived(
    !!shellState && (screen === 'add' || shellState.tabs.length === 0 || !!shellState.pendingLink)
  )

  // Shell screens cover the active server's view while they're open.
  $effect(() => {
    window.shell.setOverlay(screen !== 'tabs')
  })

  function closeAdd(): void {
    if (shellState?.pendingLink) window.shell.dismissLink()
    screen = 'tabs'
  }
</script>

{#if shellState}
  <div class="shell">
    <TabBar
      snapshot={shellState}
      onAdd={() => (screen = 'add')}
      onSettings={() => (screen = screen === 'settings' ? 'tabs' : 'settings')}
      onSelect={(id) => {
        screen = 'tabs'
        window.shell.selectTab(id)
      }}
    />
    <main>
      {#if showAdd}
        <AddServer
          pendingLink={shellState.pendingLink}
          canCancel={shellState.tabs.length > 0 || !!shellState.pendingLink}
          onAdded={() => (screen = 'tabs')}
          onCancel={closeAdd}
        />
      {:else if screen === 'settings'}
        <Settings snapshot={shellState} onClose={() => (screen = 'tabs')} />
      {:else if active?.status === 'failed'}
        <Offline tab={active} />
      {/if}
    </main>
    {#if shellState.picker}
      <Picker sources={shellState.picker.sources} />
    {/if}
  </div>
{/if}

<style>
  .shell {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  main {
    flex: 1;
    min-height: 0;
  }
</style>
