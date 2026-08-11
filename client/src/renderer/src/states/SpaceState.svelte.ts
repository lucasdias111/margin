import type { Space } from '$src/interfaces/Space'
import { SvelteSet } from 'svelte/reactivity'

class SpaceState {
  spaces = $state<Space[]>([])
  expandedSpaceIds = new SvelteSet<number>()

  setSpaces(spaces: Space[]): void {
    this.spaces = spaces
  }

  isExpanded(spaceId: number): boolean {
    return this.expandedSpaceIds.has(spaceId)
  }

  toggleExpanded(spaceId: number): void {
    if (!this.expandedSpaceIds.delete(spaceId)) this.expandedSpaceIds.add(spaceId)
  }

  expand(spaceId: number): void {
    this.expandedSpaceIds.add(spaceId)
  }

  clear(): void {
    this.spaces = []
    this.expandedSpaceIds.clear()
  }
}

export const spaceState = new SpaceState()
