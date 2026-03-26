import {types as MediasoupTypes} from 'mediasoup'

export function createWebRtcTransport(router: MediasoupTypes.Router) {
    return router.createWebRtcTransport({
        listenIps: [{ip: '0.0.0.0', announcedIp: process.env.ANNOUNCED_IP || '127.0.0.1'}],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true
    })
}