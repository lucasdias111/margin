<script lang="ts">
  import { errorState } from '$src/states/ErrorState.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { errorService } from '$src/services/ErrorService'
</script>

{#if errorState.hasError}
  <div class="toast" role="alert">
    <div class="toast-icon">
      <Icon name="alertCircle" size={14} strokeWidth={2.5} />
    </div>
    <div class="toast-body">
      <span class="toast-title">Something went wrong</span>
      <span class="toast-msg">{errorState.errorMessage}</span>
    </div>
    <button class="toast-close" aria-label="Dismiss" onclick={() => errorService.clearError()}>
      <Icon name="x" size={12} strokeWidth={2.5} />
    </button>
    <div class="toast-progress"></div>
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
    padding: 12px 14px 16px 12px;
    width: 320px;
    overflow: hidden;
    z-index: 9999;
    animation: slideIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  .toast-icon {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: #fde8e8;
    color: #c0392b;
    display: flex;
    align-items: center;
    justify-content: center;
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

  .toast-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    width: 100%;
    background: #e74c3c;
    border-radius: 0 0 10px 10px;
    animation: shrink 3s linear forwards;
    transform-origin: left;
  }

  @keyframes slideIn {
    from {
      transform: translateY(-12px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes shrink {
    from {
      transform: scaleX(1);
    }
    to {
      transform: scaleX(0);
    }
  }
</style>
