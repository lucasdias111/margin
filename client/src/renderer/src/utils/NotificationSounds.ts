import newMessageSound from '$src/assets/sounds/default-message.mp3'
import incomingCallSound from '$src/assets/sounds/default-call.mp3'
import pendingCallSound from '$src/assets/sounds/default-pending-call.mp3'

export const NotificationSounds = {
  NEW_MESSAGE: newMessageSound,
  INCOMING_CALL: incomingCallSound,
  PENDING_CALL: pendingCallSound
} as const
