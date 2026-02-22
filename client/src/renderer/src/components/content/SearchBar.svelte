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
    class="search-user-input"
    on:input={handleInput}
    bind:value={searchQuery}
  />

  {#if searchResults.length > 0}
    <div class="search-results">
      {#each searchResults as user (user.id)}
        <div class="user-result" on:click={() => openChat(user)} role="button" tabindex="0">
          <span>{user.username}</span>
        </div>
      {/each}
    </div>
  {/if}

  <button class="add-user-button"> +</button>
</div>

<style>
  .search-container {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-top: 10px;
  }

  .search-user-input {
    flex: 1;
    width: 160px;
    padding: 10px 16px;
    border-radius: 999px;
    border: 2px solid rgb(207, 207, 207);
    outline: none;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  .search-results {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 40px;
    background: white;
    border: 2px solid rgb(207, 207, 207);
    border-radius: 16px;
    max-height: 300px;
    overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    z-index: 1000;
    padding: 6px;
  }

  input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .user-result {
    padding: 8px 14px;
    border-radius: 999px;
    cursor: pointer;
    transition: background-color 0.2s;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 14px;
    color: black;
  }

  .user-result:hover {
    background-color: #f5f5f5;
  }

  .add-user-button {
    background-color: #da6b10;
    border-radius: 10px;
    font-size: 18px;
    border: none;
    color: white;
    cursor: pointer;
    padding: 8px 12px;
  }
</style>
