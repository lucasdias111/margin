import {types as MediasoupTypes} from 'mediasoup'

export function createWebRtcTransport(router: MediasoupTypes.Router, webRtcServer: MediasoupTypes.WebRtcServer) {
    return router.createWebRtcTransport({
        webRtcServer,
        enableUdp: true,
        enableTcp: true,
        preferUdp: true
    })
}
