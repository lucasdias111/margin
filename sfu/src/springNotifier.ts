import {internalApiKey} from './authorizationHelper.js'

const springUrl = process.env.SPRING_URL ?? 'http://localhost:8080'

function internalHeaders(): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        'X-Internal-Api-Key': internalApiKey
    }
}

export async function notifyPeerJoined(roomId: string, peerId: string): Promise<void> {
    const res = await fetch(`${springUrl}/api/sfu/peer_joined`, {
        method: 'POST',
        headers: internalHeaders(),
        body: JSON.stringify({roomId, peerId})
    })
    if (!res.ok) console.error(`Spring rejected peer_joined: ${res.status}`)
}

export async function notifyPeerLeft(roomId: string, peerId: string): Promise<void> {
    const res = await fetch(`${springUrl}/api/sfu/peer_left`, {
        method: 'POST',
        headers: internalHeaders(),
        body: JSON.stringify({roomId, peerId})
    })
    if (!res.ok) console.error(`Spring rejected peer_left: ${res.status}`)
}