<script lang="ts">
  import Button from '$src/components/common/buttons/Button.svelte'

  interface Props {
    link: string
    onDismiss?: () => void
  }

  let { link, onDismiss }: Props = $props()
  let copied = $state(false)

  async function copy(): Promise<void> {
    await navigator.clipboard.writeText(link)
    copied = true
    setTimeout(() => (copied = false), 2000)
  }
</script>

<div class="admin-link">
  <input class="admin-input" value={link} readonly onfocus={(e) => e.currentTarget.select()} />
  <Button buttonType="primary" size="small" text={copied ? 'Copied' : 'Copy'} onClick={copy} />
  {#if onDismiss}
    <Button buttonType="secondary" size="small" text="Done" onClick={onDismiss} />
  {/if}
</div>
