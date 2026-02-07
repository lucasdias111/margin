import http from 'http'
import { WebSocketServer } from 'ws'
import { Peer, Room } from './types'
import { createWebRtcTransport } from './transportFactory'

export function initMediaSoupServer(app: any, rooms: Map<string, Room>) {
    const server = http.createServer(app)
    const wss = new WebSocketServer({ server })

    console.log('WebSocket server initialized')

    wss.on('connection', (ws) => {
        let peer: Peer | null = null
        let room: Room | undefined = undefined

        ws.on('message', async (data) => {
            const msg = JSON.parse(data.toString())

            try {
                switch (msg.type) {
                    case 'getRouterRtpCapabilities': {
                        room = rooms.get(msg.roomId)
                        if (!room) {
                            console.error(`Room ${msg.roomId} does not exist`)
                            throw new Error('Room does not exist')
                        }

                        peer = {
                            id: msg.peerId,
                            ws,
                            transports: new Map(),
                            producers: new Map(),
                            consumers: new Map()
                        }

                        room.peers.set(peer.id, peer)
                        console.log(`Peer ${peer.id} joined room ${msg.roomId} (${room.peers.size} peers)`)

                        ws.send(
                            JSON.stringify({
                                type: 'routerRtpCapabilities',
                                rtpCapabilities: room.router.rtpCapabilities
                            })
                        )
                        break
                    }

                    case 'createWebRtcTransport': {
                        if (!room || !peer) {
                            console.error('Cannot create transport: room or peer not initialized')
                            throw new Error('Room or peer not initialized')
                        }

                        const transport = await createWebRtcTransport(room.router)
                        peer.transports.set(transport.id, transport)

                        ws.send(
                            JSON.stringify({
                                type: 'transportCreated',
                                direction: msg.direction,
                                params: {
                                    id: transport.id,
                                    iceParameters: transport.iceParameters,
                                    iceCandidates: transport.iceCandidates,
                                    dtlsParameters: transport.dtlsParameters
                                }
                            })
                        )
                        break
                    }

                    case 'connectTransport': {
                        if (!peer) {
                            console.error('Cannot connect transport: peer not initialized')
                            throw new Error('Peer not initialized')
                        }

                        const transport = peer.transports.get(msg.transportId)
                        if (!transport) {
                            console.error(`Transport ${msg.transportId} not found for peer ${peer.id}`)
                            throw new Error('Transport not found')
                        }

                        await transport.connect({ dtlsParameters: msg.dtlsParameters })

                        ws.send(
                            JSON.stringify({
                                type: 'transportConnected',
                                transportId: transport.id
                            })
                        )
                        break
                    }

                    case 'produce': {
                        if (!room || !peer) {
                            console.error('Cannot produce: room or peer not initialized')
                            throw new Error('Room or peer not initialized')
                        }

                        const transport = peer.transports.get(msg.transportId)
                        if (!transport) {
                            console.error(`Transport ${msg.transportId} not found for peer ${peer.id}`)
                            throw new Error('Transport not found')
                        }

                        const producer = await transport.produce({
                            kind: msg.kind,
                            rtpParameters: msg.rtpParameters
                        })

                        peer.producers.set(producer.id, producer)
                        console.log(`Producer ${producer.id} created by peer ${peer.id} (${msg.kind})`)

                        ws.send(
                            JSON.stringify({
                                type: 'produced',
                                producerId: producer.id
                            })
                        )

                        // Notify other peers
                        for (const p of room.peers.values()) {
                            if (p.id !== peer.id) {
                                p.ws.send(
                                    JSON.stringify({
                                        type: 'newProducer',
                                        producerId: producer.id,
                                        peerId: peer.id
                                    })
                                )
                            }
                        }
                        break
                    }

                    case 'consume': {
                        if (!room || !peer) {
                            console.error('Cannot consume: room or peer not initialized')
                            throw new Error('Room or peer not initialized')
                        }

                        const transport = peer.transports.get(msg.transportId)
                        if (!transport) {
                            console.error(`Transport ${msg.transportId} not found for peer ${peer.id}`)
                            throw new Error('Transport not found')
                        }

                        const producerPeer = [...room.peers.values()].find(p => p.producers.has(msg.producerId))

                        if (!producerPeer) {
                            console.error(`Producer peer not found for producer ${msg.producerId}`)
                            throw new Error('Producer peer not found')
                        }

                        const producer = producerPeer.producers.get(msg.producerId)!

                        const consumer = await transport.consume({
                            producerId: producer.id,
                            rtpCapabilities: msg.rtpCapabilities,
                            paused: false
                        })

                        peer.consumers.set(consumer.id, consumer)
                        console.log(`Consumer ${consumer.id} created: peer ${peer.id} consuming from peer ${producerPeer.id}`)

                        ws.send(
                            JSON.stringify({
                                type: 'consumed',
                                id: consumer.id,
                                producerId: producer.id,
                                kind: consumer.kind,
                                rtpParameters: consumer.rtpParameters
                            })
                        )
                        break
                    }

                    case 'getProducers': {
                        if (!room || !peer) {
                            console.error('Cannot get producers: room or peer not initialized')
                            throw new Error('Room or peer not initialized')
                        }

                        for (const p of room.peers.values()) {
                            if (p.id === peer.id) continue

                            for (const producer of p.producers.values()) {
                                ws.send(
                                    JSON.stringify({
                                        type: 'newProducer',
                                        producerId: producer.id,
                                        peerId: p.id
                                    })
                                )
                            }
                        }
                        break
                    }

                    default:
                        console.log(`Unknown message type: ${msg.type}`)
                }
            } catch (err) {
                console.error(`Error for peer ${peer?.id || 'unknown'}:`, err)
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
            console.log(`Peer ${peer.id} left room ${room.id} (${room.peers.size} peers remaining)`)
        })

        ws.on('error', (error) => {
            console.error(`WebSocket error for peer ${peer?.id || 'unknown'}:`, error)
        })
    })

    return server
}