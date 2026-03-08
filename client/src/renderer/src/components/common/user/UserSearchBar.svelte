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
    width: 100%;
    margin-top: 0;
  }

  .search-user-input {
    width: 100%;
    padding: 8px 14px;
    border-radius: 10px;
    border: 1.5px solid #ebebeb;
    background: #fafafa;
    outline: none;
    font-family: inherit;
    font-size: 13px;
    color: #2a2a2a;
    transition:
      border-color 0.15s,
      background 0.15s;
    box-sizing: border-box;
  }

  .search-user-input::placeholder {
    color: #c1c1c1;
  }

  .search-user-input:focus {
    border-color: #f47e3a;
    background: white;
  }

  .search-results {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    background: white;
    border: 1.5px solid #ebebeb;
    border-radius: 12px;
    max-height: 260px;
    overflow-y: auto;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
    z-index: 1000;
    padding: 4px;
  }

  .user-result {
    display: block;
    width: 100%;
    text-align: left;
    padding: 8px 12px;
    border-radius: 9px;
    border: none;
    background: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    color: #2a2a2a;
    transition:
      background 0.12s,
      color 0.12s;
  }

  .user-result:hover {
    background: rgba(0, 0, 0, 0.04);
    color: #1c1c1c;
  }

  .status-message {
    display: block;
    padding: 8px 12px;
    font-size: 12px;
    color: #c1c1c1;
    font-family: inherit;
  }

  .status-message.error {
    color: #c0392b;
  }
</style>
