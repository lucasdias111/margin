export interface PeeredRoom {
    peers: Map<string, unknown>
}

export function peersByRoom(rooms: Map<string, PeeredRoom>): Record<string, string[]> {
    const result: Record<string, string[]> = {}

    for (const [roomId, room] of rooms) {
        if (room.peers.size === 0) continue
        result[roomId] = [...room.peers.keys()]
    }

    return result
}
