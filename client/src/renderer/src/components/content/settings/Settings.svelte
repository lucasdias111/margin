<script lang="ts">
  import { userState } from '$src/states/UserState.svelte.js'
  import { nameWithCapInitials } from '$src/utils/NamesUtils'
  import Icon from '$src/components/common/icons/Icon.svelte'

  let email: string = $derived(userState.currentUser.email)
  let handle: string = $derived(userState.currentUser.handle)
</script>

<div class="settings-panel">
  <div class="settings-header">
    <Icon name="settings" size={16} />
    <span>Settings</span>
  </div>

  <div class="divider"></div>

  <div class="section">
    <span class="section-label">Account</span>
    <div class="info-row">
      <span class="label">Name</span>
      <span class="value">{nameWithCapInitials()}</span>
    </div>
    <div class="info-row">
      <span class="label">Email</span>
      <span class="value">{email}</span>
    </div>
    <div class="info-row">
      <span class="label">Handle</span>
      <span class="value">{handle}</span>
    </div>
  </div>

  <div class="divider"></div>
</div>

<style>
  .settings-panel {
    display: flex;
    flex-direction: column;
    padding: 16px 12px;
    gap: 12px;
  }

  .settings-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.95rem;
    font-weight: 600;
    color: #f47e3a;
    padding: 8px 10px;
    background: rgba(228, 113, 42, 0.08);
    border-radius: 8px;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 4px;
  }

  .section-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #999;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 8px;
    border-radius: 6px;
    transition: background 0.12s ease;
  }

  .info-row:hover {
    background: rgba(0, 0, 0, 0.03);
  }

  .label {
    font-size: 0.8rem;
    color: #666;
    font-weight: 500;
  }

  .value {
    font-size: 0.8rem;
    color: #2d2d2d;
    font-weight: 500;
  }

  .divider {
    height: 1px;
    background: rgba(0, 0, 0, 0.06);
  }
</style>
