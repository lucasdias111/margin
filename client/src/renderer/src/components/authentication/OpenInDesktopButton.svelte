<script lang="ts">
  import Button from '$src/components/common/buttons/Button.svelte'
  import { instanceService } from '$src/services/InstanceService'
  import { desktopOpenUrl } from '$src/utils/desktopLink'
  import { isDesktopShell } from '$src/utils/platformUtils'

  interface Props {
    // The page's canonical path on the instance, e.g. /meet/<code>.
    path: string
  }

  let { path }: Props = $props()

  function open(): void {
    window.location.href = desktopOpenUrl(instanceService.publicLink(path))
  }
</script>

{#if !isDesktopShell()}
  <Button
    buttonType="secondary"
    size="medium"
    text="Open in desktop app"
    fullWidth
    onClick={open}
  />
{/if}
