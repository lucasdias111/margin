import { authenticatedGet } from '$src/services/api'
import { userState } from '$src/states/UserState.svelte'
import { Device } from 'mediasoup-client'
import type { Transport, TransportOptions } from 'mediasoup-client/types'

async function connectToWebSocket(wsUrl: string | URL): Promise<WebSocket> {
  const sfuWs = new WebSocket(wsUrl)

  await new Promise((resolve, reject) => {
    sfuWs.onopen = resolve
    sfuWs.onerror = reject
  })
  return sfuWs
}

async function getRtpCapabilities(sfuWs: WebSocket, channelId: number): Promise<never> {
  return await new Promise<never>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('RTP capabilities timeout')), 5000)

    sfuWs.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'routerRtpCapabilities') {
        clearTimeout(timeout)
        resolve(msg.rtpCapabilities)
      }
    }

    sfuWs.send(
      JSON.stringify({
        type: 'getRouterRtpCapabilities',
        roomId: String(channelId),
        peerId: String(userState.currentUser.id)
      })
    )
  })
}

async function createSendTransport(sfuWs: WebSocket, channelId: number): Promise<TransportOptions> {
  return await new Promise<never>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Send transport timeout')), 5000)

    sfuWs.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'transportCreated' && msg.direction === 'send') {
        clearTimeout(timeout)
        resolve(msg.params)
      }
    }

    sfuWs.send(
      JSON.stringify({
        type: 'createWebRtcTransport',
        direction: 'send',
        roomId: String(channelId)
      })
    )
  })
}

function connectTransport(sendTransport: Transport, sfuWs: WebSocket): void {
  sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
    try {
      // Send our DTLS parameters to complete the handshake
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connect timeout')), 5000)

        sfuWs.onmessage = (event) => {
          const msg = JSON.parse(event.data)
          if (msg.type === 'transportConnected' && msg.transportId === sendTransport.id) {
            clearTimeout(timeout)
            resolve()
          }
        }

        sfuWs.send(
          JSON.stringify({
            type: 'connectTransport',
            transportId: sendTransport.id,
            dtlsParameters
          })
        )
      })

      callback() // Tell mediasoup the connection succeeded
      console.log('✓ Send transport connected')
    } catch (error) {
      errback(error as Error)
    }
  })
}

function createSendProducer(sendTransport: Transport, sfuWs: WebSocket): void {
  sendTransport.on('produce', async ({ kind, rtpParameters }, callback) => {
    const { producerId } = await new Promise<{ producerId: string }>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Produce timeout')), 5000)

      sfuWs.onmessage = (event) => {
        const msg = JSON.parse(event.data)
        if (msg.type === 'produced') {
          clearTimeout(timeout)
          resolve({ producerId: msg.producerId })
        }
      }

      sfuWs.send(
        JSON.stringify({
          type: 'produce',
          transportId: sendTransport.id,
          kind,
          rtpParameters
        })
      )
    })

    callback({ id: producerId })
    console.log(`✓ Producer created: ${producerId} (${kind})`)
  })
}

async function handleReceiveProducer(
  sfuWs: WebSocket,
  channelId: number
): Promise<TransportOptions> {
  return await new Promise<never>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Recv transport timeout')), 5000)

    sfuWs.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'transportCreated' && msg.direction === 'recv') {
        clearTimeout(timeout)
        resolve(msg.params)
      }
    }

    sfuWs.send(
      JSON.stringify({
        type: 'createWebRtcTransport',
        direction: 'recv',
        roomId: String(channelId)
      })
    )
  })
}

function handleReceiveTransport(recvTransport: Transport, sfuWs: WebSocket): void {
  recvTransport.on('connect', async ({ dtlsParameters }, callback) => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connect timeout')), 5000)

      sfuWs.onmessage = (event) => {
        const msg = JSON.parse(event.data)
        if (msg.type === 'transportConnected' && msg.transportId === recvTransport.id) {
          clearTimeout(timeout)
          resolve()
        }
      }

      sfuWs.send(
        JSON.stringify({
          type: 'connectTransport',
          transportId: recvTransport.id,
          dtlsParameters
        })
      )
    })

    callback()
  })
}

function receiveExternalProducers(
  sfuWs: WebSocket,
  recvTransport: Transport,
  device: Device
): void {
  sfuWs.onmessage = async (event) => {
    const msg = JSON.parse(event.data)

    if (msg.type === 'newProducer') {
      if (String(msg.peerId) === String(userState.currentUser.id)) {
        return
      }

      sfuWs.send(
        JSON.stringify({
          type: 'consume',
          transportId: recvTransport.id,
          producerId: msg.producerId,
          rtpCapabilities: device.rtpCapabilities
        })
      )

      const consumeHandler = async (event: MessageEvent): Promise<void> => {
        const response = JSON.parse(event.data)
        if (response.type === 'consumed' && response.producerId === msg.producerId) {
          const consumer = await recvTransport.consume({
            id: response.id,
            producerId: response.producerId,
            kind: response.kind,
            rtpParameters: response.rtpParameters
          })

          const audioElement = new Audio()
          audioElement.srcObject = new MediaStream([consumer.track])
          audioElement.autoplay = true

          console.log(`✓ Now receiving ${response.kind} from peer ${msg.peerId}`)

          sfuWs.removeEventListener('message', consumeHandler)
        }
      }

      sfuWs.addEventListener('message', consumeHandler)
    }
  }
}

export async function joinVoiceChannel(channelId: number): Promise<void> {
  console.log(`Joining voice channel ${channelId}`)

  const permissionResponse = await authenticatedGet(`sfu/connection-info?roomId=${channelId}`)
  if (!permissionResponse.ok) {
    throw new Error('Not authorized to join this voice channel')
  }
  const { wsUrl } = await permissionResponse.json()

  const sfuWs = await connectToWebSocket(wsUrl)

  const rtpCapabilities = await getRtpCapabilities(sfuWs, channelId)

  const device = new Device()
  await device.load({ routerRtpCapabilities: rtpCapabilities })

  const sendTransportParams = await createSendTransport(sfuWs, channelId)
  const sendTransport = device.createSendTransport(sendTransportParams)

  connectTransport(sendTransport, sfuWs)

  createSendProducer(sendTransport, sfuWs)
  const recvTransportParams = await handleReceiveProducer(sfuWs, channelId)
  const recvTransport = device.createRecvTransport(recvTransportParams)

  handleReceiveTransport(recvTransport, sfuWs)

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    },
    video: false
  })
  const audioTrack = stream.getAudioTracks()[0]
  await sendTransport.produce({ track: audioTrack })

  receiveExternalProducers(sfuWs, recvTransport, device)

  sfuWs.send(
    JSON.stringify({
      type: 'getProducers',
      roomId: String(channelId)
    })
  )
}
