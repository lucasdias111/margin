export function clickOutside(node: HTMLElement, callback: () => void): { destroy(): void } {
  function handleClick(event: MouseEvent): void {
    if (!node.contains(event.target as Node)) {
      callback()
    }
  }

  setTimeout(() => document.addEventListener('click', handleClick), 0)

  return {
    destroy() {
      document.removeEventListener('click', handleClick)
    }
  }
}
