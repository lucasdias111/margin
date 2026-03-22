import {WebSocket} from 'ws'
import {Peer, Room} from './types.js'
import {createWebRtcTransport} from './transportFactory.js'
import {verifyRoomToken} from './authorizationHelper.js'
import {notifyPeerJoined} from './springNotifier.js'

export async function handleGetRouterRtpCapabilities(
    msg: any,
    ws: WebSocket,
    rooms: Map<string, Room>
): Promise<{ peer: Peer; room: Room }> {
    verifyRoomToken(msg.token, msg.roomId)

    const room = rooms.get(msg.roomId)
    if (!room) throw new Error('Room does not exist')

    const existingPeer = room.peers.get(msg.peerId)
    if (existingPeer) {
        existingPeer.transports.forEach(t => t.close())
        existingPeer.producers.forEach(p => p.close())
        existingPeer.consumers.forEach(c => c.close())
        room.peers.delete(msg.peerId)
    }

    const peer: Peer = {
        id: msg.peerId,
        displayName: msg.displayName,
        ws,
        transports: new Map(),
        producers: new Map(),
        consumers: new Map()
    }
    room.peers.set(peer.id, peer)
    console.log(`Peer ${peer.id} joined room ${msg.roomId} (${room.peers.size} peers)`)

    notifyPeerJoined(msg.roomId, msg.peerId).catch(err =>
        console.error('Failed to notify Spring of peer joining:', err)
    )

    ws.send(JSON.stringify({
        type: 'routerRtpCapabilities',
        rtpCapabilities: room.router.rtpCapabilities
    }))

    return {peer, room}
}

export async function handleCreateWebRtcTransport(
    msg: any,
    ws: WebSocket,
    peer: Peer,
    room: Room
): Promise<void> {
    const transport = await createWebRtcTransport(room.router)
    peer.transports.set(transport.id, transport)

    ws.send(JSON.stringify({
        type: 'transportCreated',
        direction: msg.direction,
        params: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters
        }
    }))
}

export async function handleConnectTransport(
    msg: any,
    ws: WebSocket,
    peer: Peer
): Promise<void> {
    const transport = peer.transports.get(msg.transportId)
    if (!transport) throw new Error('Transport not found')

    await transport.connect({dtlsParameters: msg.dtlsParameters})

    ws.send(JSON.stringify({
        type: 'transportConnected',
        transportId: transport.id
    }))
}

export async function handleProduce(
    msg: any,
    ws: WebSocket,
    peer: Peer,
    room: Room
): Promise<void> {
    const transport = peer.transports.get(msg.transportId)
    if (!transport) throw new Error('Transport not found')

    const producer = await transport.produce({
        kind: msg.kind,
        rtpParameters: msg.rtpParameters
    })

    peer.producers.set(producer.id, producer)
    console.log(`Producer ${producer.id} created by peer ${peer.id} (${msg.kind})`)

    ws.send(JSON.stringify({type: 'produced', producerId: producer.id}))

    for (const p of room.peers.values()) {
        if (p.id !== peer.id) {
            p.ws.send(JSON.stringify({
                type: 'newProducer',
                producerId: producer.id,
                peerId: peer.id,
                displayName: peer.displayName,
            }))
        }
    }
}

export async function handleConsume(
    msg: any,
    ws: WebSocket,
    peer: Peer,
    room: Room
): Promise<void> {
    const transport = peer.transports.get(msg.transportId)
    if (!transport) throw new Error('Transport not found')

    const producerPeer = [...room.peers.values()].find(p => p.producers.has(msg.producerId))
    if (!producerPeer) throw new Error('Producer peer not found')

    const producer = producerPeer.producers.get(msg.producerId)!
    const consumer = await transport.consume({
        producerId: producer.id,
        rtpCapabilities: msg.rtpCapabilities,
        paused: false
    })

    peer.consumers.set(consumer.id, consumer)
    console.log(`Consumer ${consumer.id} created: peer ${peer.id} consuming from peer ${producerPeer.id}`)

    ws.send(JSON.stringify({
        type: 'consumed',
        id: consumer.id,
        producerId: producer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters
    }))
}

export function handleGetProducers(ws: WebSocket, peer: Peer, room: Room): void {
    for (const p of room.peers.values()) {
        if (p.id === peer.id) continue
        for (const producer of p.producers.values()) {
            ws.send(JSON.stringify({
                type: 'newProducer',
                producerId: producer.id,
                peerId: p.id,
                displayName: p.displayName
            }))
        }
    }
}