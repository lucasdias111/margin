<script lang="ts">
  import { authenticatedGet } from '$src/services/api'
  import type { User } from '$src/interfaces/User'
  import type { UserSearchResult } from '$src/interfaces/UserSearchResult'
  import { clickOutside } from '$src/actions/clickOutside'

  interface Props {
    onSelectUser: (user: User) => void
    showSharedMargins?: boolean
  }

  let { onSelectUser, showSharedMargins = false }: Props = $props()

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

  async function searchUsers(query: string): Promise<void> {
    isLoading = true
    hasError = false

    try {
      const response = await authenticatedGet(
        `users/search?query=${encodeURIComponent(query.slice(0, 100))}`
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

  function handleSelectUser(user: UserSearchResult['user']): void {
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

<div class="search-container" use:clickOutside={clearSearch}>
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
      {#each searchResults as result (result.user.id)}
        <button
          class="user-result"
          role="option"
          aria-selected="false"
          onclick={() => handleSelectUser(result.user)}
        >
          <div class="user-result-content">
            <span class="username">{result.user.username}</span>
            {#if showSharedMargins && result.sharedMargins.length > 0}
              <div class="shared-margins">
                {#each result.sharedMargins as margin (margin)}
                  <span class="margin-tag">{margin}</span>
                {/each}
              </div>
            {/if}
          </div>
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
    transition:
      background 0.12s,
      color 0.12s;
  }

  .user-result:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  .user-result-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .username {
    font-size: 13px;
    font-weight: 500;
    color: #2a2a2a;
  }

  .shared-margins {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 2px;
  }

  .margin-tag {
    font-size: 10px;
    font-weight: 500;
    color: #e8712a;
    background: rgba(232, 113, 42, 0.08);
    padding: 2px 7px;
    border-radius: 999px;
    letter-spacing: 0.02em;
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
