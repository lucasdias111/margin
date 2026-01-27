<script>
  import { userState } from '$src/states/UserState.svelte'
  import SearchBar from '$src/components/content/SearchBar.svelte'
</script>

<div class="topbar">
  <h1>margin</h1>
  <SearchBar />
  <p>{userState.currentUser?.username}</p>
</div>

<style>
  .topbar {
    height: 60px;
    background-color: #1a1a1a;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    border-bottom: 1px solid #333;
  }

  .topbar h1 {
    margin: 0;
    font-size: 24px;
  }

  .topbar p {
    margin: 0;
  }
</style>
