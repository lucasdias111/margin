import type { Margin } from '$src/interfaces/Margin'

class MarginState {
  isMemberOfAnyMargins = $state<boolean>(true)
  margins = $state<Margin[]>([])

  setIsMemberOfAnyMargins(isMemberOfAnyMargins: boolean): void {
    this.isMemberOfAnyMargins = isMemberOfAnyMargins
  }

  setMargins(margins: Margin[]): void {
    this.margins = margins
  }
}

export const marginState = new MarginState()
