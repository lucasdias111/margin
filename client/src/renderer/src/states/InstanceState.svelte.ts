import type { InstanceInfo } from '$src/interfaces/Instance'

class InstanceState {
  info = $state<InstanceInfo | null>(null)

  get mailEnabled(): boolean {
    return this.info?.mailEnabled ?? false
  }

  get gifsEnabled(): boolean {
    return this.info?.features.gifs ?? false
  }

  get webPushEnabled(): boolean {
    return this.info?.features.webPush ?? false
  }
}

export const instanceState = new InstanceState()
