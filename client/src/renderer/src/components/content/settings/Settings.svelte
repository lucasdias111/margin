<script lang="ts">
  import { userState } from '$src/states/UserState.svelte.js'
  import SettingsIcon from '$src/components/svg/SettingsIcon.svelte'
  import { nameWithCapInitials } from '$src/utils/NamesUtils'

  let email: string = $derived(userState.currentUser.email)
</script>

<div class="setpanel">
  <div class="avatar">
    <span class="settings-header">
      <SettingsIcon height={15} width={15} strokeWidthCirc={2.8} strokeWidth={2.2} />
      Settings
    </span>
  </div>
  <div class="userinfo">
    <span class="username">{nameWithCapInitials()}</span>
    <span class="email">{email}</span>
  </div>
  <div class="panel-divider"></div>
</div>

<style>
  .setpanel {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 8px;
  }

  .settings-header {
    font-weight: 60;
    color: #f47e3a;
    gap: 8px;
    text-align: left;
    transition:
      background 0.12s,
      color 0.12s;
    padding: 0;
    display: flex;
    flex-direction: row;
  }

  .userinfo {
    display: flex;
    flex-direction: row;
    margin-top: 5px;
    gap: 120px;
    color: #f47e3a;
    font-family: 'Inter', sans-serif;
  }

  .username {
    font-size: 0.8rem;
  }

  .email {
    font-size: 0.8rem;
  }

  .avatar {
    display: flex;
    flex-direction: column;
    padding: 6px 10px;
    border-radius: 8px;
    margin-bottom: 4px;
    background: rgba(228, 113, 42, 0.1);
    font-size: 0.95rem;
    font-weight: 200;
    color: #2d2d2d;
  }

  .panel-divider {
    height: 1px;
    background: rgba(0, 0, 0, 0.05);
    flex-shrink: 0;
  }
</style>
