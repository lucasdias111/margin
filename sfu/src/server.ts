import express from 'express'
import mediasoup, {types as MediasoupTypes} from 'mediasoup'
import {Room} from './types.js'
import {getOrCreateRoom} from './roomHelpers.js'
import {peersByRoom} from './peerHelpers.js'
import {initMediaSoupServer} from './mediaSoupHelper.js'
import {requireInternalApiKey} from "./authorizationHelper.js";
import {DEFAULT_IDLE_MS, reapIdleRooms} from './roomReaper.js'
import {readRtcConfig, RtcConfig} from './rtcConfig.js'

const rtcConfig = readRtcConfigOrExit()
const rooms = new Map<string, Room>()
let worker: MediasoupTypes.Worker
let webRtcServer: MediasoupTypes.WebRtcServer

function readRtcConfigOrExit(): RtcConfig {
    try {
        return readRtcConfig(process.env)
    } catch (err) {
        console.error(err instanceof Error ? err.message : err)
        process.exit(1)
    }
}

async function initMediasoup() {
    worker = await mediasoup.createWorker()

    worker.on('died', () => {
        console.error('mediasoup worker died')
        process.exit(1)
    })

    // One UDP and one TCP port shared by every transport, instead of a port per transport.
    const {announcedAddress, port} = rtcConfig
    webRtcServer = await worker.createWebRtcServer({
        listenInfos: [
            {protocol: 'udp', ip: '0.0.0.0', announcedAddress, port},
            {protocol: 'tcp', ip: '0.0.0.0', announcedAddress, port}
        ]
    })

    console.log(`mediasoup worker ready (media on ${announcedAddress}:${port} udp+tcp)`)
}

const app = express()
app.use(express.json())

app.get('/health', (_req, res) => {
    if (!worker || worker.closed || !webRtcServer || webRtcServer.closed) {
        return res.status(503).json({status: 'unavailable'})
    }
    res.json({status: 'ok'})
})

app.post('/rooms/:roomId', requireInternalApiKey, async (req, res) => {
    const maxParticipants = Number(req.body?.maxParticipants)
    if (!Number.isInteger(maxParticipants) || maxParticipants <= 0) {
        return res.status(400).json({error: 'maxParticipants must be a positive integer'})
    }

    const room = await getOrCreateRoom(rooms, req.params.roomId, worker, webRtcServer, maxParticipants)

    res.json({
        roomId: room.id,
        rtpCapabilities: room.router.rtpCapabilities,
        maxParticipants: room.maxParticipants
    })
})

app.get('/rooms/peers', requireInternalApiKey, (_req, res) => {
    res.json({rooms: peersByRoom(rooms)})
})

app.get('/rooms/:roomId/peers', requireInternalApiKey, (req, res) => {
    const room = rooms.get(req.params.roomId)
    if (!room) return res.status(200).json({peers: []})
    res.json({peers: [...room.peers.keys()]})
})

app.delete('/rooms/:roomId', requireInternalApiKey, (req, res) => {
    const room = rooms.get(req.params.roomId)
    if (!room) return res.status(204).send()

    room.peers.forEach(p => p.ws.close())
    room.router.close()
    rooms.delete(room.id)
    console.log(`✓ Room closed on request: ${room.id}`)

    res.status(204).send()
})

const server = initMediaSoupServer(app, rooms)
await initMediasoup()

const idleMs = Number(process.env.SFU_ROOM_IDLE_MS ?? DEFAULT_IDLE_MS)
const sweep = setInterval(() => {
    const reaped = reapIdleRooms(rooms, Date.now(), idleMs)
    if (reaped.length > 0) {
        console.log(`✓ Reaped ${reaped.length} idle room(s): ${reaped.join(', ')}`)
    }
}, 60_000)
sweep.unref()

server.listen(3000, () => {
    console.log(`Hybrid SFU running on http://localhost:3000 (room idle window ${idleMs}ms)`)
})

