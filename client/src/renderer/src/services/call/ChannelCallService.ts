import { authenticatedPost } from '$src/services/api'
import { Device } from 'mediasoup-client'
import type { Producer, RtpCapabilities, RtpParameters, Transport, TransportOptions } from 'mediasoup-client/types'
import { callState } from '$src/states/CallState.svelte.js'
import { errorService } from '$src/services/ErrorService'
import {
  deviceService,
  defaultDeviceConstraint,
  getUserMediaPreferringDefault
} from '$src/services/DeviceService'
import { ICE_SERVERS } from '$src/services/call/iceServers'
import { sessionState } from '$src/states/SessionState.svelte'

class ChannelCallService {
  private async connectToWebSocket(wsUrl: string): Promise<WebSocket> {
    const ws = new WebSocket(wsUrl)
    await new Promise((resolve, reject) => {
      ws.onopen = resolve
      ws.onerror = reject
    })
    return ws
  }

  private sendMessage(ws: WebSocket, type: string, data: Record<string, unknown> = {}): void {
    ws.send(JSON.stringify({ type, ...data }))
  }

  private waitForMessage(
    ws: WebSocket,
    messageType: string,
    filter?: (msg: Record<string, unknown>) => boolean
  ): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`${messageType} timeout`)), 5000)

      const handler = (event: MessageEvent): void => {
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

  private async getRtpCapabilities(
    ws: WebSocket,
    channelId: number,
    roomToken: string
  ): Promise<RtpCapabilities> {
    const user = sessionState.currentUser
    if (!user) throw new Error('Cannot start call: not authenticated')
    this.sendMessage(ws, 'getRouterRtpCapabilities', {
      roomId: String(channelId),
      peerId: user.id,
      displayName: user.displayName,
      token: roomToken
    })

    const msg = await this.waitForMessage(ws, 'routerRtpCapabilities')
    return msg.rtpCapabilities as RtpCapabilities
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
    return msg.params as TransportOptions
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
    transport.on('produce', async ({ kind, rtpParameters, appData }, callback) => {
      this.sendMessage(ws, 'produce', {
        transportId: transport.id,
        kind,
        rtpParameters,
        appData
      })
      const msg = await this.waitForMessage(ws, 'produced')
      callback({ id: msg.producerId as string })
    })
  }

  private setupConsumer(recvTransport: Transport, device: Device, ws: WebSocket): void {
    ws.addEventListener('message', async (event) => {
      const msg = JSON.parse(event.data)

      if (msg.type === 'peer_left') {
        callState.removeGroupParticipant(String(msg.peerId))
        return
      }

      if (msg.type === 'producerClosed') {
        const peerId = String(msg.peerId)
        const existing = callState.groupCallState?.participants.find((p) => p.peerId === peerId)
        if (!existing) return

        if (msg.appData?.source === 'screen') {
          callState.addGroupParticipant({
            ...existing,
            screenStream: null,
            isScreenSharing: false
          })
        } else if (msg.appData?.source === 'camera') {
          callState.addGroupParticipant({
            ...existing,
            videoStream: null,
            isVideoEnabled: false
          })
        }
        return
      }

      if (msg.type !== 'newProducer') return
      if (msg.peerId === sessionState.currentUser?.id) return

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
        id: response.id as string,
        producerId: response.producerId as string,
        kind: response.kind as 'audio' | 'video',
        rtpParameters: response.rtpParameters as RtpParameters
      })

      const isScreenShare = msg.appData?.source === 'screen'
      const stream = new MediaStream([consumer.track])
      const peerId = String(msg.peerId)
      const existing = callState.groupCallState?.participants.find((p) => p.peerId === peerId)

      callState.addGroupParticipant({
        peerId,
        displayName: msg.displayName ?? 'Unknown',
        profilePictureUrl: msg.profilePictureUrl ?? null,
        audioStream: consumer.kind === 'audio' ? stream : (existing?.audioStream ?? null),
        videoStream:
          consumer.kind === 'video' && !isScreenShare ? stream : (existing?.videoStream ?? null),
        screenStream:
          consumer.kind === 'video' && isScreenShare ? stream : (existing?.screenStream ?? null),
        isVideoEnabled:
          consumer.kind === 'video' && !isScreenShare ? true : (existing?.isVideoEnabled ?? false),
        isScreenSharing: isScreenShare ? true : (existing?.isScreenSharing ?? false)
      })
    })
  }

  async joinVoiceChannel(channelId: number): Promise<void> {
    if (callState.isGroupCall) return

    try {
      const response = await authenticatedPost(null, `sfu/create_or_join?roomId=${channelId}`)
      if (!response.ok) {
        errorService.reportError('Failed to join voice channel')
        return
      }

      const { sfuUrl, roomToken, maxVideoHeight } = await response.json()
      const sfuWs = await this.connectToWebSocket(sfuUrl.replace('http', 'ws'))

      const rtpCapabilities = await this.getRtpCapabilities(sfuWs, channelId, roomToken)
      const device = new Device()
      await device.load({ routerRtpCapabilities: rtpCapabilities })

      const sendParams = await this.createTransport(sfuWs, 'send', channelId)
      const sendTransport = device.createSendTransport({ ...sendParams, iceServers: ICE_SERVERS })
      this.setupTransportConnection(sendTransport, sfuWs)
      this.setupProducer(sendTransport, sfuWs)

      const receiveParameters = await this.createTransport(sfuWs, 'recv', channelId)
      const receiveTransport = device.createRecvTransport({
        ...receiveParameters,
        iceServers: ICE_SERVERS
      })
      this.setupTransportConnection(receiveTransport, sfuWs)
      this.setupConsumer(receiveTransport, device, sfuWs)

      const audioBase: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
      const localStream = await getUserMediaPreferringDefault(
        { audio: defaultDeviceConstraint(audioBase), video: false },
        { audio: audioBase, video: false }
      )

      const audioTrack = localStream.getAudioTracks()[0]
      const audioProducer = await sendTransport.produce({
        track: audioTrack,
        appData: { source: 'mic' }
      })

      this.sendMessage(sfuWs, 'getProducers', { roomId: String(channelId) })

      callState.startGroupCall(channelId, channelId)
      callState.setGroupSession({
        sfuWebsocket: sfuWs,
        rtpCapabilities,
        device,
        sendTransport,
        receiveTransport,
        localStream,
        audioProducer,
        videoProducer: null,
        maxVideoHeight: maxVideoHeight ?? null,
        preferredVideoHeight: null,
        preferredScreenHeight: null
      })
      callState.setStatus('connected')

      await deviceService.enumerateDevices()
      deviceService.startListening()
    } catch (err) {
      callState.endCall()
      console.error(err)
      errorService.reportError('Failed to join voice channel')
    }
  }

  toggleAudio(): void {
    const session = callState.groupCallState?.session
    if (!session) return
    const audioTrack = session.localStream.getAudioTracks()[0]
    if (!audioTrack) return
    audioTrack.enabled = !audioTrack.enabled
    callState.setGroupAudioEnabled(audioTrack.enabled)
  }

  async toggleVideo(): Promise<void> {
    const group = callState.groupCallState
    const session = group?.session
    if (!session) return

    if (session.videoProducer) {
      if (session.sfuWebsocket) {
        this.sendMessage(session.sfuWebsocket, 'producerClosed', {
          producerId: session.videoProducer.id,
          appData: { source: 'camera' }
        })
      }
      session.videoProducer.track?.stop()
      session.videoProducer.close()
      callState.setGroupVideoProducer(null)
      callState.setGroupVideoEnabled(false)
    } else {
      try {
        const effectiveVideoHeight = session.preferredVideoHeight ?? session.maxVideoHeight
        const videoConstraints: MediaTrackConstraints | boolean = effectiveVideoHeight
          ? { height: { max: effectiveVideoHeight } }
          : true
        const videoStream = await getUserMediaPreferringDefault(
          { video: defaultDeviceConstraint(videoConstraints) },
          { video: videoConstraints }
        )
        const videoTrack = videoStream.getVideoTracks()[0]
        const producer: Producer = await session.sendTransport.produce({
          track: videoTrack,
          appData: { source: 'camera' }
        })
        callState.setGroupVideoProducer(producer)
        callState.setGroupVideoEnabled(true)

        producer.on('trackended', () => {
          this.toggleVideo()
        })
      } catch (err) {
        errorService.reportError('Camera not available: ' + err)
      }
    }
  }

  async toggleScreenShare(): Promise<void> {
    const group = callState.groupCallState
    if (!group?.session) return

    if (group.screenShareProducer) {
      this.stopScreenShare()
    } else {
      await this.startScreenShare()
    }
  }

  private async startScreenShare(): Promise<void> {
    const session = callState.groupCallState?.session
    if (!session) return

    try {
      const effectiveScreenHeight = session.preferredScreenHeight ?? session.maxVideoHeight
      const screenVideoConstraints: MediaTrackConstraints | boolean = effectiveScreenHeight
        ? { height: { max: effectiveScreenHeight } }
        : true
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: screenVideoConstraints,
        audio: false
      })
      const screenTrack = screenStream.getVideoTracks()[0]
      const producer: Producer = await session.sendTransport.produce({
        track: screenTrack,
        appData: { source: 'screen' }
      })

      callState.setGroupScreenShareProducer(producer)
      callState.setGroupScreenSharing(true)

      screenTrack.onended = () => this.stopScreenShare()
      producer.on('trackended', () => this.stopScreenShare())
    } catch (err) {
      errorService.reportError('Screen share failed: ' + err)
    }
  }

  private stopScreenShare(): void {
    const group = callState.groupCallState
    if (!group?.screenShareProducer) return

    const session = group.session
    if (session?.sfuWebsocket) {
      this.sendMessage(session.sfuWebsocket, 'producerClosed', {
        producerId: group.screenShareProducer.id,
        appData: { source: 'screen' }
      })
    }

    group.screenShareProducer.track?.stop()
    group.screenShareProducer.close()
    callState.setGroupScreenShareProducer(null)
    callState.setGroupScreenSharing(false)
  }

  async setVideoQuality(height: number | null): Promise<void> {
    const session = callState.groupCallState?.session
    if (!session) return
    callState.setGroupVideoQuality(height)
    if (!session.videoProducer) return
    const effective = height ?? session.maxVideoHeight
    const constraint: MediaTrackConstraints | boolean = effective ? { height: { max: effective } } : true
    const stream = await navigator.mediaDevices.getUserMedia({ video: constraint })
    const newTrack = stream.getVideoTracks()[0]
    await session.videoProducer.replaceTrack({ track: newTrack })
    session.localStream.getVideoTracks().forEach((t) => t.stop())
  }

  async setScreenShareQuality(height: number | null): Promise<void> {
    const session = callState.groupCallState?.session
    if (!session) return
    callState.setGroupScreenShareQuality(height)
    const screenProducer = callState.groupCallState?.screenShareProducer
    if (!screenProducer?.track) return
    const effective = height ?? session.maxVideoHeight
    if (effective) {
      await screenProducer.track.applyConstraints({ height: { max: effective } })
    }
  }

  endChannelCall(): void {
    const group = callState.groupCallState
    const session = group?.session
    if (!session) return

    session.videoProducer?.close()
    group.screenShareProducer?.close()
    session.localStream.getTracks().forEach((t) => t.stop())
    session.sendTransport.close()
    session.receiveTransport.close()
    session.sfuWebsocket?.close()

    deviceService.cleanup()
    callState.endCall()
  }
}

export const channelCallService = new ChannelCallService()
