<script lang="ts">
  import { authenticatedGet } from '$src/services/api'
  import type { User } from '$src/interfaces/User'
  import type { UserSearchResult } from '$src/interfaces/UserSearchResult'

  interface Props {
    onSelectUser: (user: User) => void
  }

  let { onSelectUser }: Props = $props()

  let searchQuery = $state('')
  let searchResults = $state<UserSearchResult[]>([])
  let isLoading = $state(false)
  let hasError = $state(false)

  $effect(() => {
    const query = searchQuery
    if (!query.trim()) {
      searchResults = []
      return null
    }

    const timeout = setTimeout(() => searchUsers(query), 300)
    return () => clearTimeout(timeout)
  })

  function clickOutside(node: HTMLElement): { destroy(): void } {
    function handleClick(event: MouseEvent): void {
      if (!node.contains(event.target as Node)) clearSearch()
    }
    document.addEventListener('click', handleClick)
    return {
      destroy() {
        document.removeEventListener('click', handleClick)
      }
    }
  }

  async function searchUsers(query: string): Promise<void> {
    isLoading = true
    hasError = false

    try {
      const response = await authenticatedGet(
        `api/users/search?query=${encodeURIComponent(query.slice(0, 100))}`
      )
      const data = await response.json()
      searchResults = data || []
    } catch (error) {
      console.error('Search failed:', error)
      hasError = true
      searchResults = []
    } finally {
      isLoading = false
    }
  }

  function handleSelectUser(user: User): void {
    clearSearch()
    onSelectUser(user)
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') clearSearch()
  }

  function clearSearch(): void {
    searchResults = []
    searchQuery = ''
    hasError = false
  }
</script>

<div class="search-container" use:clickOutside>
  <input
    type="text"
    placeholder="Search users..."
    class="search-user-input"
    bind:value={searchQuery}
    onkeydown={handleKeydown}
    maxlength="100"
    aria-label="Search users"
    aria-autocomplete="list"
  />

  {#if isLoading}
    <div class="search-results">
      <span class="status-message">Searching...</span>
    </div>
  {:else if hasError}
    <div class="search-results">
      <span class="status-message error">Search failed. Try again.</span>
    </div>
  {:else if searchQuery.trim() && searchResults.length === 0}
    <div class="search-results">
      <span class="status-message">No users found.</span>
    </div>
  {:else if searchResults.length > 0}
    <div class="search-results" role="listbox">
      {#each searchResults as user (user.id)}
        <button
          class="user-result"
          role="option"
          aria-selected="false"
          onclick={() => handleSelectUser(user)}
        >
          <span>{user.username}</span>
        </button>
      {/each}
    </div>
  {/if}
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
    padding: 10px 16px;
    border-radius: 999px;
    border: 2px solid rgb(207, 207, 207);
    outline: none;
    font-family: inherit;
    font-size: 14px;
  }

  .search-user-input:focus {
    border-color: #f47e3a;
  }

  .search-results {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 48px;
    background: white;
    border: 2px solid rgb(207, 207, 207);
    border-radius: 16px;
    max-height: 300px;
    overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    z-index: 1000;
    padding: 6px;
  }

  .user-result {
    display: block;
    width: 100%;
    text-align: left;
    padding: 8px 14px;
    border-radius: 999px;
    border: none;
    background: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    color: black;
    transition: background-color 0.15s;
  }

  .user-result:hover {
    background-color: #f5f5f5;
  }

  .status-message {
    display: block;
    padding: 8px 14px;
    font-size: 13px;
    color: #888;
    font-family: inherit;
  }

  .status-message.error {
    color: #c0392b;
  }
</style>
