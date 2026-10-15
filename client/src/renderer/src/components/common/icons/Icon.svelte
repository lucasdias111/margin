<script lang="ts">
  import { icons, type IconName } from '$src/components/common/icons/icons'

  interface Props {
    name: IconName
    size?: number
    color?: string
    strokeWidth?: number
  }

  let { name, size = 24, color = 'currentColor', strokeWidth = 2 }: Props = $props()
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke={color}
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <!-- eslint-disable svelte/no-at-html-tags -->
  {@html icons[name]}
</svg>
