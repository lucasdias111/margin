<script lang="ts">
  import AppModal from '$src/components/common/modals/AppModal.svelte'
  import Button from '$src/components/common/buttons/Button.svelte'

  interface Props {
    open: boolean
    title: string
    content: string
    onClose: () => void
  }

  let { open, title, content, onClose }: Props = $props()
</script>

<AppModal {open} {title} {onClose}>
  <div class="policy-content">
    {@html content}
  </div>
  <div class="actions">
    <Button buttonType="primary" onClick={onClose}>Close</Button>
  </div>
</AppModal>

<style>
  .policy-content {
    max-height: 400px;
    overflow-y: auto;
    padding: 4px 16px 4px 4px;
    font-size: 13px;
    line-height: 1.6;
    color: #333;
  }

  .policy-content :global(h1) {
    font-size: 18px;
    font-weight: 700;
    margin: 20px 0 8px;
    color: #1a1a1a;
  }

  .policy-content :global(h1:first-child) {
    margin-top: 0;
  }

  .policy-content :global(h2) {
    font-size: 15px;
    font-weight: 600;
    margin: 16px 0 6px;
    color: #1a1a1a;
  }

  .policy-content :global(h3) {
    font-size: 14px;
    font-weight: 600;
    margin: 12px 0 4px;
    color: #1a1a1a;
  }

  .policy-content :global(p) {
    margin: 0 0 10px;
  }

  .policy-content :global(ul) {
    margin: 0 0 10px;
    padding-left: 20px;
  }

  .policy-content :global(li) {
    margin-bottom: 4px;
  }

  .policy-content :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 12px;
  }

  .policy-content :global(th),
  .policy-content :global(td) {
    border: 1px solid #ece8e0;
    padding: 6px 10px;
    text-align: left;
  }

  .policy-content :global(th) {
    background: #f7f4ef;
    font-weight: 600;
  }

  .policy-content :global(strong) {
    font-weight: 600;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    padding-top: 12px;
  }
</style>
