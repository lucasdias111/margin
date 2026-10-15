import test from 'node:test'
import assert from 'node:assert/strict'
import {peersByRoom, type PeeredRoom} from './peerHelpers.ts'

function room(...peerIds: string[]): PeeredRoom {
    return {peers: new Map(peerIds.map((id) => [id, {}]))}
}

test('returns an empty map when there are no rooms', () => {
    assert.deepEqual(peersByRoom(new Map()), {})
})

test('returns peer ids keyed by room id', () => {
    const rooms = new Map<string, PeeredRoom>([
        ['12', room('3', '5')],
        ['40', room('7')]
    ])

    assert.deepEqual(peersByRoom(rooms), {'12': ['3', '5'], '40': ['7']})
})

test('omits rooms that have no peers left', () => {
    const rooms = new Map<string, PeeredRoom>([
        ['12', room('3')],
        ['40', room()],
        ['41', room()]
    ])

    assert.deepEqual(peersByRoom(rooms), {'12': ['3']})
})

test('does not expose the live peer map', () => {
    const live = room('3')
    const result = peersByRoom(new Map([['12', live]]))

    live.peers.set('9', {})

    assert.deepEqual(result, {'12': ['3']})
})
