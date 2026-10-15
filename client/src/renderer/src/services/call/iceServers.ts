// No TURN relay is configured in the client any more: each instance will hand out its own,
// short-lived TURN credentials. Until then calls rely on direct connectivity.
export const ICE_SERVERS: RTCIceServer[] = []
