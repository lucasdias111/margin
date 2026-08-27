export interface ReapableRoom {
    id: string
    peers: { size: number }
    lastEmptyAt: number | null
    router: { close(): void }
}

export const DEFAULT_IDLE_MS = 5 * 60 * 1000

export function markRoomEmptiness(room: ReapableRoom, now: number): void {
    if (room.peers.size === 0) {
        room.lastEmptyAt ??= now
    } else {
        room.lastEmptyAt = null
    }
}

export function reapIdleRooms(
    rooms: Map<string, ReapableRoom>,
    now: number,
    idleMs: number = DEFAULT_IDLE_MS
): string[] {
    const reaped: string[] = []

    for (const [roomId, room] of rooms) {
        if (room.peers.size > 0) continue
        if (room.lastEmptyAt === null) continue
        if (now - room.lastEmptyAt < idleMs) continue

        room.router.close()
        rooms.delete(roomId)
        reaped.push(roomId)
    }

    return reaped
}
