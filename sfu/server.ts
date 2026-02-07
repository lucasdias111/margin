import express from 'express'
import mediasoup from 'mediasoup'
import {
  Worker
} from 'mediasoup/node/lib/types'
import { Room } from './types'
import { getOrCreateRoom } from './roomHelpers'
import { initMediaSoupServer } from './mediaSoupHelper'


const rooms = new Map<string, Room>()
let worker: Worker



async function initMediasoup() {
  worker = await mediasoup.createWorker({
    rtcMinPort: 40000,
    rtcMaxPort: 49999
  })

  worker.on('died', () => {
    console.error('mediasoup worker died')
    process.exit(1)
  })

  console.log('mediasoup worker ready')
}


const app = express()
app.use(express.json())

app.post('/rooms/:roomId', async (req, res) => {
  const room = await getOrCreateRoom(rooms, req.params.roomId, worker)

  res.json({
    roomId: room.id,
    rtpCapabilities: room.router.rtpCapabilities
  })
})

app.get('/rooms/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId)
  if (!room) return res.status(404).json({ error: 'Not found' })

  res.json({
    roomId: room.id,
    peerCount: room.peers.size,
    rtpCapabilities: room.router.rtpCapabilities
  })
})

const server = initMediaSoupServer(app, rooms)
await initMediasoup()

server.listen(3000, () => {
  console.log('Hybrid SFU running on http://localhost:3000')
})

