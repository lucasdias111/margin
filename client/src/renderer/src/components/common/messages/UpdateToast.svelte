<script lang="ts">
  import { updateState } from '$src/states/UpdateState.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { updateService } from '$src/services/UpdateService'
  import { toastIn, toastOut } from '$src/animations'

  function accept(): void {
    updateService.setIsDownloading(true)
    window.updater?.acceptUpdate()
  }

  function dismiss(): void {
    updateService.setUpdateAvailable(false)
  }

  function dismissError(): void {
    updateService.clearError()
  }

  function install(): void {
    window.updater?.installUpdate()
  }
</script>

{#if updateState.error}
  <div class="toast" role="alert" in:toastIn out:toastOut>
    <div class="toast-icon toast-icon--error">
      <Icon name="x" size={14} strokeWidth={2.5} />
    </div>
    <div class="toast-body">
      <span class="toast-title">Update failed</span>
      <span class="toast-msg">{updateState.error}</span>
    </div>
    <button class="toast-close" aria-label="Dismiss" onclick={dismissError}>
      <Icon name="x" size={12} strokeWidth={2.5} />
    </button>
  </div>
{:else if updateState.updateDownloaded}
  <div class="toast" role="alert" in:toastIn out:toastOut>
    <div class="toast-icon toast-icon--success">
      <Icon name="checkCircle" size={14} strokeWidth={2.5} />
    </div>
    <div class="toast-body">
      <span class="toast-title">Update ready</span>
      <span class="toast-msg">Version {updateState.version} is ready to install</span>
    </div>
    <button class="toast-action" onclick={install}>Restart</button>
  </div>
{:else if updateState.updateAvailable}
  <div class="toast" role="alert" in:toastIn out:toastOut>
    <div class="toast-icon toast-icon--update">
      <Icon name="arrowUpCircle" size={14} strokeWidth={2.5} />
    </div>
    <div class="toast-body">
      <span class="toast-title">Update available</span>
      <span class="toast-msg">Version {updateState.version} is ready to download</span>
    </div>
    {#if updateState.downloading}
      <span class="toast-downloading">Downloading {Math.round(updateState.progress)}%</span>
    {:else}
      <button class="toast-action" onclick={accept}>Update</button>
      <button class="toast-close" aria-label="Dismiss" onclick={dismiss}>
        <Icon name="x" size={12} strokeWidth={2.5} />
      </button>
    {/if}
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    top: 45px;
    right: 25px;
    display: flex;
    align-items: center;
    gap: 10px;
    background: white;
    border: 1px solid #ece8e0;
    border-radius: 10px;
    padding: 12px 14px;
    width: 320px;
    overflow: hidden;
    z-index: 9999;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  .toast-icon {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toast-icon--update {
    background: #fef3e2;
    color: #e8712a;
  }

  .toast-icon--success {
    background: #e8f5e9;
    color: #2e7d32;
  }

  .toast-icon--error {
    background: #fdecea;
    color: #c62828;
  }

  .toast-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .toast-title {
    font-size: 13px;
    font-weight: 600;
    color: #2c2c2a;
  }

  .toast-msg {
    font-size: 12px;
    color: #888780;
  }

  .toast-action {
    flex-shrink: 0;
    background: #e8712a;
    color: white;
    border: none;
    padding: 5px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }

  .toast-action:hover {
    background: #d4641f;
  }

  .toast-downloading {
    flex-shrink: 0;
    font-size: 12px;
    color: #888780;
    font-weight: 500;
  }

  .toast-close {
    flex-shrink: 0;
    background: none;
    border: none;
    cursor: pointer;
    color: #b4b2a9;
    padding: 2px;
    display: flex;
    align-items: center;
    border-radius: 4px;
    transition: color 0.15s;
  }

  .toast-close:hover {
    color: #2c2c2a;
  }
</style>
