import newMessageSound from '$src/assets/sounds/default-message.mp3'
import incomingCallSound from '$src/assets/sounds/default-call.mp3'

export const NotificationSounds = {
  NEW_MESSAGE: newMessageSound,
  INCOMING_CALL: incomingCallSound
} as const
