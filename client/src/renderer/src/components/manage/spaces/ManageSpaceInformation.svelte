<script lang="ts">
  import type { Space } from '$src/interfaces/Space'

  let roles = [{ name: 'Admin', access: 'Read/Write' }]

  interface Props {
    selectedSpace: Space
  }

  let { selectedSpace }: Props = $props()
</script>

<div class="spaces-information">
  {#if selectedSpace}
    <div class="spaces-basic-info">
      <h2>Information</h2>
      <div class="info-row">
        <div class="info-fields">
          <label for="space-name-input">Space name</label>
          <input
            class="space-name-input"
            type="text"
            id="space-name-input"
            placeholder={selectedSpace.spaceName}
          />
          <label for="space-description">Description</label>
          <textarea id="space-description" rows="4" placeholder={selectedSpace.spaceDescription}
          ></textarea>
        </div>
        <div class="info-picture">
          <span class="picture-label">Margin picture</span>
          <div class="picture-circle"></div>
          <button class="upload-btn">Upload</button>
        </div>
      </div>
    </div>

    <div class="spaces-roles">
      <h2>Roles</h2>
      <div class="table-card">
        <div class="table-header">
          <span>Role Name</span>
          <span>Accesses</span>
        </div>
        {#each roles as role (role.name)}
          <div class="table-row">
            <span class="role-name">{role.name}</span>
            <span class="role-access">{role.access}</span>
            <div class="row-actions">
              <button class="icon-btn">✏️</button>
              <button class="icon-btn">🗑️</button>
            </div>
          </div>
        {/each}
        <button class="add-row-btn">+</button>
      </div>
    </div>

    <div class="spaces-channels">
      <h2>Channels</h2>
      <div class="table-card">
        <div class="table-header three-col">
          <span>Channel name</span>
          <span>Channel type</span>
          <span>Access</span>
        </div>
        {#each selectedSpace.channels as channel (channel.id)}
          <div class="table-row three-col">
            <span class="role-name">{channel.name}</span>
            <span>{channel.type}</span>
            <span>{channel.description}</span>
            <div class="row-actions">
              <button class="icon-btn">✏️</button>
              <button class="icon-btn">🗑️</button>
            </div>
          </div>
        {/each}
        <button class="add-row-btn">+</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .spaces-information {
    flex: 2;
    border-right: 1px solid #d9d9d9;
    padding: 20px 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  h2 {
    font-size: 1.1rem;
    color: #2d2d2d;
    font-weight: 600;
    margin: 0 0 14px 0;
  }

  .info-row {
    display: flex;
    gap: 24px;
    align-items: flex-start;
  }

  .info-fields {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }

  label {
    font-size: 0.8rem;
    color: #888;
  }

  input[type='text'],
  textarea {
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 0.9rem;
    color: #2d2d2d;
    outline: none;
    resize: none;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
  }

  input[type='text']:focus,
  textarea:focus {
    border-color: #f5a623;
  }

  .info-picture {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .picture-label {
    font-size: 0.78rem;
    color: #888;
  }

  .picture-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: #d9d9d9;
  }

  .upload-btn {
    background: #2d2d2d;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 7px 16px;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .table-card {
    border: 1px solid #e8e8e8;
    border-radius: 10px;
    overflow: hidden;
  }

  .table-header {
    display: grid;
    grid-template-columns: 1fr 1fr 60px;
    padding: 8px 16px;
    font-size: 0.78rem;
    color: #888;
    background: #fafafa;
    border-bottom: 1px solid #e8e8e8;
  }

  .table-header.three-col {
    grid-template-columns: 1fr 1fr 1fr 60px;
  }

  .table-row {
    display: grid;
    grid-template-columns: 1fr 1fr 60px;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 0.9rem;
  }

  .table-row.three-col {
    grid-template-columns: 1fr 1fr 1fr 60px;
  }

  .table-row:last-of-type {
    border-bottom: none;
  }

  .role-name {
    font-weight: 600;
    color: #2d2d2d;
  }

  .row-actions {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
  }

  .icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.9rem;
    padding: 2px;
    line-height: 1;
  }

  .add-row-btn {
    width: 100%;
    background: #f5f5f5;
    border: none;
    border-top: 1px solid #e8e8e8;
    padding: 10px;
    font-size: 1.1rem;
    cursor: pointer;
    color: #555;
    border-radius: 0 0 10px 10px;
  }

  .add-row-btn:hover {
    background: #eeeeee;
  }
</style>
