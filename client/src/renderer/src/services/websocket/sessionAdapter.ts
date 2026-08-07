import type { WebSocketSessionAdapter } from '$src/services/websocket/WebSocketService'
import { authenticationService } from '$src/services/AuthenticationService'
import { errorService } from '$src/services/ErrorService'

export const webSocketSessionAdapter: WebSocketSessionAdapter = {
  getToken: () => sessionStorage.getItem('authToken'),

  restoreSession: () => authenticationService.tryRestoreSession(),

  onSessionInvalid: (reason) => {
    if (reason) errorService.reportError(reason)
    void authenticationService.clear()
  }
}
