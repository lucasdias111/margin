<script lang="ts">
  import type { Space } from '$src/interfaces/Space'

  interface Props {
    selectedSpace: Space
  }

  let { selectedSpace }: Props = $props()
  if (selectedSpace) {
    console.log(selectedSpace.members)
  }
</script>

<div class="space-members">
  {#if selectedSpace}
    <div class="members-header">
      <h2>Members</h2>
      <button class="add-member-btn">Add member</button>
    </div>
    <div class="search-bar">
      <input type="text" placeholder="Search member" />
    </div>
    <div class="members-table">
      <div class="members-table-header">
        <span>Member</span>
        <span>Role</span>
        <span>Added date</span>
        <span></span>
      </div>
      {#each selectedSpace.members as member (member.user.id)}
        <div class="member-row">
          <span class="member-name">{member.user.username}</span>
          <span>{member.role}</span>
          <span>{member.joinedAt}</span>
          <button class="icon-btn">⋮</button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .space-members {
    flex: 2;
    padding: 20px 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  h2 {
    color: #2d2d2d;
  }

  .members-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .members-header h2 {
    margin: 0;
  }

  .add-member-btn {
    background: #2d2d2d;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 9px 18px;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
  }

  .search-bar input {
    border: 1px solid #d9d9d9;
    border-radius: 20px;
    padding: 8px 16px;
    font-size: 0.88rem;
    outline: none;
    width: 180px;
    background: #f5f5f5;
  }

  .members-table {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .members-table-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1.5fr 30px;
    font-size: 0.78rem;
    color: #888;
    padding: 6px 0 8px 0;
    border-bottom: 1px solid #d9d9d9;
  }

  .member-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1.5fr 30px;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
    font-size: 0.9rem;
    color: #2d2d2d;
  }

  .member-name {
    font-weight: 700;
  }
</style>
