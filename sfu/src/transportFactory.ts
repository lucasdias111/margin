import os from 'os'
import {types as MediasoupTypes} from 'mediasoup'

function getAnnouncedIp(): string {
    if (process.env.ANNOUNCED_IP) return process.env.ANNOUNCED_IP
    for (const nets of Object.values(os.networkInterfaces())) {
        for (const net of nets ?? []) {
            if (net.family === 'IPv4' && !net.internal) return net.address
        }
    }
    return '127.0.0.1'
}

const ANNOUNCED_IP = getAnnouncedIp()

export function createWebRtcTransport(router: MediasoupTypes.Router) {
    return router.createWebRtcTransport({
        listenIps: [{ip: '0.0.0.0', announcedIp: ANNOUNCED_IP}],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true
    })
}