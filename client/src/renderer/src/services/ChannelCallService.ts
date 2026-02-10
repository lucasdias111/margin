import { authenticatedGet } from '$src/services/api'
import { userState } from '$src/states/UserState.svelte'
import { Device } from 'mediasoup-client'
import type { Transport, TransportOptions } from 'mediasoup-client/types'
import { callState } from '$src/states/CallState.svelte'

class ChannelCallService {
  private async connectToWebSocket(wsUrl: string): Promise<WebSocket> {
    const ws = new WebSocket(wsUrl)
    await new Promise((resolve, reject) => {
      ws.onopen = resolve
      ws.onerror = reject
    })
    return ws
  }

  private sendMessage(ws: WebSocket, type: string, data: Record<string, any> = {}): void {
    ws.send(JSON.stringify({ type, ...data }))
  }

  private waitForMessage(
    ws: WebSocket,
    messageType: string,
    filter?: (msg: any) => boolean
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`${messageType} timeout`)), 5000)

      const handler = (event: MessageEvent) => {
        const msg = JSON.parse(event.data)
        if (msg.type === messageType && (!filter || filter(msg))) {
          clearTimeout(timeout)
          ws.removeEventListener('message', handler)
          resolve(msg)
        }
      }

      ws.addEventListener('message', handler)
    })
  }

  private async getRtpCapabilities(ws: WebSocket, channelId: number): Promise<any> {
    this.sendMessage(ws, 'getRouterRtpCapabilities', {
      roomId: String(channelId),
      peerId: String(userState.currentUser.id)
    })

    const msg = await this.waitForMessage(ws, 'routerRtpCapabilities')
    return msg.rtpCapabilities
  }

  private async createTransport(
    ws: WebSocket,
    direction: 'send' | 'recv',
    channelId: number
  ): Promise<TransportOptions> {
    this.sendMessage(ws, 'createWebRtcTransport', {
      direction,
      roomId: String(channelId)
    })

    const msg = await this.waitForMessage(ws, 'transportCreated', (m) => m.direction === direction)
    return msg.params
  }

  private setupTransportConnection(transport: Transport, ws: WebSocket): void {
    transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        this.sendMessage(ws, 'connectTransport', {
          transportId: transport.id,
          dtlsParameters
        })

        await this.waitForMessage(ws, 'transportConnected', (m) => m.transportId === transport.id)
        callback()
      } catch (error) {
        errback(error as Error)
      }
    })
  }

  private setupProducer(transport: Transport, ws: WebSocket): void {
    transport.on('produce', async ({ kind, rtpParameters }, callback) => {
      this.sendMessage(ws, 'produce', {
        transportId: transport.id,
        kind,
        rtpParameters
      })

      const msg = await this.waitForMessage(ws, 'produced')
      callback({ id: msg.producerId })
    })
  }

  private setupConsumer(recvTransport: Transport, device: Device, ws: WebSocket): void {
    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data)

      if (msg.type === 'newProducer' && String(msg.peerId) !== String(userState.currentUser.id)) {
        this.sendMessage(ws, 'consume', {
          transportId: recvTransport.id,
          producerId: msg.producerId,
          rtpCapabilities: device.rtpCapabilities
        })

        const response = await this.waitForMessage(
          ws,
          'consumed',
          (m) => m.producerId === msg.producerId
        )

        const consumer = await recvTransport.consume({
          id: response.id,
          producerId: response.producerId,
          kind: response.kind,
          rtpParameters: response.rtpParameters
        })

        const audio = new Audio()
        audio.srcObject = new MediaStream([consumer.track])
        audio.autoplay = true
      }
    }
  }

  async joinVoiceChannel(channelId: number): Promise<void> {
    const permissionResponse = await authenticatedGet(`sfu/create_or_join?roomId=${channelId}`)
    if (!permissionResponse.ok) {
      throw new Error('Not authorized to join this voice channel')
    }

    const wsUrl = await permissionResponse.text()
    const sfuWs = await this.connectToWebSocket(wsUrl)

    callState.startGroupCall(channelId, channelId)

    const rtpCapabilities = await this.getRtpCapabilities(sfuWs, channelId)

    const device = new Device()
    await device.load({ routerRtpCapabilities: rtpCapabilities })

    const sendParams = await this.createTransport(sfuWs, 'send', channelId)
    const sendTransport = device.createSendTransport(sendParams)
    this.setupTransportConnection(sendTransport, sfuWs)
    this.setupProducer(sendTransport, sfuWs)

    const receiveParameters = await this.createTransport(sfuWs, 'recv', channelId)
    const receiveTransport = device.createRecvTransport(receiveParameters)
    this.setupTransportConnection(receiveTransport, sfuWs)
    this.setupConsumer(receiveTransport, device, sfuWs)

    const localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: false
    })

    const audioTrack = localStream.getAudioTracks()[0]
    await sendTransport.produce({ track: audioTrack })

    this.sendMessage(sfuWs, 'getProducers', { roomId: String(channelId) })

    callState.setGroupSession({
      sfuWebsocket: sfuWs,
      rtpCapabilities,
      device,
      sendTransport,
      receiveTransport,
      localStream
    })
  }

  endChannelCall(): void {
    const group = callState.groupCallState
    const session = group?.session
    if (!session) return

    const { localStream, sendTransport, receiveTransport, sfuWebsocket } = session

    localStream.getTracks().forEach((t) => t.stop())
    sendTransport.close()
    receiveTransport.close()
    sfuWebsocket?.close()

    callState.endCall()
  }
}

export const channelCallService = new ChannelCallService()
