import { Room } from "./types"
import {
  Worker
} from 'mediasoup/node/lib/types'

export async function getOrCreateRoom(rooms: Map<string, Room>, roomId: string, worker: Worker): Promise<Room> {
  if (rooms.has(roomId)) return rooms.get(roomId)!

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
    peers: new Map()
  }

  rooms.set(roomId, room)
  console.log(`✓ Room created: ${roomId}`)
  return room
}