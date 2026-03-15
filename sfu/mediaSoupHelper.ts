import http from 'http'
import {WebSocketServer} from 'ws'
import {Peer, Room} from './types'
import {notifyPeerLeft} from './springNotifier'
import {
    handleConnectTransport,
    handleConsume,
    handleCreateWebRtcTransport,
    handleGetProducers,
    handleGetRouterRtpCapabilities,
    handleProduce
} from './messageHandlers'

export function initMediaSoupServer(app: any, rooms: Map<string, Room>) {
    const server = http.createServer(app)
    const wss = new WebSocketServer({server})

    console.log('WebSocket server initialized')

    wss.on('connection', (ws) => {
        let peer: Peer | null = null
        let room: Room | undefined = undefined

        ws.on('message', async (data) => {
            const msg = JSON.parse(data.toString())

            try {
                switch (msg.type) {
                    case 'getRouterRtpCapabilities': {
                        const result = await handleGetRouterRtpCapabilities(msg, ws, rooms)
                        peer = result.peer
                        room = result.room
                        break
                    }
                    case 'createWebRtcTransport': {
                        if (!room || !peer) throw new Error('Room or peer not initialized')
                        await handleCreateWebRtcTransport(msg, ws, peer, room)
                        break
                    }
                    case 'connectTransport': {
                        if (!peer) throw new Error('Peer not initialized')
                        await handleConnectTransport(msg, ws, peer)
                        break
                    }
                    case 'produce': {
                        if (!room || !peer) throw new Error('Room or peer not initialized')
                        await handleProduce(msg, ws, peer, room)
                        break
                    }
                    case 'consume': {
                        if (!room || !peer) throw new Error('Room or peer not initialized')
                        await handleConsume(msg, ws, peer, room)
                        break
                    }
                    case 'getProducers': {
                        if (!room || !peer) throw new Error('Room or peer not initialized')
                        handleGetProducers(ws, peer, room)
                        break
                    }
                    default:
                        console.log(`Unknown message type: ${msg.type}`)
                }
            } catch (err) {
                console.error(`Error for peer ${peer?.id ?? 'unknown'}:`, err)
                ws.send(JSON.stringify({
                    type: 'error',
                    message: err instanceof Error ? err.message : 'Unknown error'
                }))
            }
        })

        ws.on('close', () => {
            if (!peer || !room) return

            peer.transports.forEach(t => t.close())
            peer.producers.forEach(p => p.close())
            peer.consumers.forEach(c => c.close())
            room.peers.delete(peer.id)

            console.log(`Peer ${peer.id} left room ${room.id}`)

            notifyPeerLeft(room.id, peer.id).catch(err =>
                console.error('Failed to notify Spring of peer leaving:', err)
            )
        })

        ws.on('error', (error) => {
            console.error(`WebSocket error for peer ${peer?.id ?? 'unknown'}:`, error)
        })
    })

    return server
}