export type RegistrationMode = 'OPEN' | 'INVITE' | 'CLOSED'

// What any client may learn about the instance before signing in (`GET /api/instance`).
export interface InstanceInfo {
  name: string
  version: string
  publicUrl: string
  registrationMode: RegistrationMode
  mailEnabled: boolean
  features: {
    gifs: boolean
    webPush: boolean
  }
}
