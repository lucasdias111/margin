import {WebSocket} from 'ws'
import {types as MediasoupTypes} from 'mediasoup'

export interface Peer {
    id: string
    displayName: string
    ws: WebSocket
    transports: Map<string, MediasoupTypes.WebRtcTransport>
    producers: Map<string, MediasoupTypes.Producer>
    consumers: Map<string, MediasoupTypes.Consumer>
}

export interface Room {
    id: string
    router: MediasoupTypes.Router
    peers: Map<string, Peer>
}