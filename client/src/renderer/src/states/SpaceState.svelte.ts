import type { Space } from '$src/interfaces/Space'

class SpaceState {
  spaces = $state<Space[]>([])

  setSpaces(spaces: Space[]): void {
    this.spaces = spaces
  }
}

export const spaceState = new SpaceState()
