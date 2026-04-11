<script lang="ts">
  import AppModal from '$src/components/common/modals/AppModal.svelte'

  interface Props {
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'danger' | 'warning'
    onConfirm: () => void
    onClose: () => void
  }

  let {
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    onConfirm,
    onClose
  }: Props = $props()
</script>

<AppModal {open} {title} {onClose}>
  <p class="message">{message}</p>
  <div class="actions">
    <button class="cancel" onclick={onClose}>{cancelLabel}</button>
    <button class="confirm {variant}" onclick={onConfirm}>{confirmLabel}</button>
  </div>
</AppModal>

<style>
  .message {
    font-size: 14px;
    color: #555;
    line-height: 1.6;
    margin: 0 0 20px;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .cancel {
    background: none;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 13px;
    font-family: inherit;
    font-weight: 500;
    cursor: pointer;
    color: #2d2d2d;
    transition: background 0.12s;
  }

  .cancel:hover {
    background: #f5f5f5;
  }

  .confirm {
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 13px;
    font-family: inherit;
    font-weight: 600;
    cursor: pointer;
    color: white;
    transition: background 0.12s;
  }

  .confirm.danger {
    background: #c0392b;
  }

  .confirm.danger:hover {
    background: #a93226;
  }

  .confirm.warning {
    background: #e8712a;
  }

  .confirm.warning:hover {
    background: #d4621a;
  }
</style>
