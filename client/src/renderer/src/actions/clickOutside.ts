export function clickOutside(node: HTMLElement, callback: () => void): { destroy(): void } {
  function handleClick(event: MouseEvent): void {
    if (!node.contains(event.target as Node)) {
      callback()
    }
  }

  document.addEventListener('click', handleClick)

  return {
    destroy() {
      document.removeEventListener('click', handleClick)
    }
  }
}
