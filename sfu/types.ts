import {Consumer, Producer, Router} from "mediasoup/node/lib/types"
import {WebRtcTransport} from "mediasoup/node/lib/WebRtcTransportTypes"
import {WebSocket} from 'ws'

export interface Peer {
    id: string
    ws: WebSocket
    transports: Map<string, WebRtcTransport>
    producers: Map<string, Producer>
    consumers: Map<string, Consumer>
}

export interface Room {
    id: string
    router: Router
    peers: Map<string, Peer>
}