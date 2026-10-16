import {Room} from "./types.js"
import {types as MediasoupTypes} from 'mediasoup'

export async function getOrCreateRoom(rooms: Map<string, Room>, roomId: string, worker: MediasoupTypes.Worker, webRtcServer: MediasoupTypes.WebRtcServer, maxParticipants: number): Promise<Room> {
    const existing = rooms.get(roomId)
    if (existing) {
        existing.maxParticipants = maxParticipants
        return existing
    }

    const router = await worker.createRouter({
        mediaCodecs: [
            {
                kind: 'audio',
                mimeType: 'audio/opus',
                clockRate: 48000,
                channels: 2
            },
            {
                kind: 'video',
                mimeType: 'video/VP8',
                clockRate: 90000
            }
        ]
    })

    const room: Room = {
        id: roomId,
        router,
        webRtcServer,
        peers: new Map(),
        maxParticipants,
        lastEmptyAt: Date.now()
    }

    rooms.set(roomId, room)
    console.log(`✓ Room created: ${roomId} (cap ${maxParticipants})`)
    return room
}