<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte'
  import { authenticatedGet } from '$src/services/api'
  import type { User } from '$src/interfaces/User'
  import { onMount } from 'svelte'

  let searchQuery = ''
  let searchResults: User[] = []
  let searchTimeout: ReturnType<typeof setTimeout>
  let searchContainer: HTMLElement

  onMount(() => {
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  })

  async function searchUsers(query: string): Promise<void> {
    if (!query.trim()) {
      searchResults = []
      return
    }

    try {
      const response = await authenticatedGet(`api/users/search?query=${encodeURIComponent(query)}`)
      const data = await response.json()
      searchResults = data || []
    } catch (error) {
      console.error('Search failed:', error)
      searchResults = []
    }
  }

  function handleInput(event: Event): void {
    searchQuery = (event.target as HTMLInputElement).value
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      searchUsers(searchQuery)
    }, 300)
  }

  function openChat(user: User): void {
    chatState.selectUser(user)
    chatState.selectPrivateChatContent()
    clearSearch()
  }

  function handleClickOutside(event: MouseEvent): void {
    if (searchContainer && !searchContainer.contains(event.target as Node)) {
      clearSearch()
    }
  }

  function clearSearch(): void {
    searchResults = []
    searchQuery = ''
  }
</script>

<div class="search-container" bind:this={searchContainer}>
  <input
    type="text"
    placeholder="Search users..."
    on:input={handleInput}
    bind:value={searchQuery}
  />

  {#if searchResults.length > 0}
    <div class="search-results">
      {#each searchResults as user (user.id)}
        <div class="user-result">
          <button on:click={() => openChat(user)}>
            <span>{user.username}</span>
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .search-container {
    position: relative;
    width: 100%;
    max-width: 400px;
  }

  input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    max-height: 300px;
    overflow-y: auto;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }

  .user-result {
    border-bottom: 1px solid #eee;
  }

  .user-result:last-child {
    border-bottom: none;
  }

  .user-result button {
    width: 100%;
    padding: 10px 12px;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.2s;
    color: black;
  }

  .user-result button:hover {
    background-color: #f5f5f5;
  }
</style>
