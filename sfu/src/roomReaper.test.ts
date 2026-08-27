import test from 'node:test'
import assert from 'node:assert/strict'
import {DEFAULT_IDLE_MS, markRoomEmptiness, reapIdleRooms, type ReapableRoom} from './roomReaper.ts'

function room(id: string, peerCount: number, lastEmptyAt: number | null): ReapableRoom & { closed: boolean } {
    const r = {
        id,
        peers: {size: peerCount},
        lastEmptyAt,
        closed: false,
        router: {
            close() {
                r.closed = true
            }
        }
    }
    return r
}

function rooms(...list: ReapableRoom[]): Map<string, ReapableRoom> {
    return new Map(list.map((r) => [r.id, r]))
}

test('reaps a room that has been empty beyond the idle window', () => {
    const empty = room('m_abc', 0, 1_000)
    const map = rooms(empty)

    const reaped = reapIdleRooms(map, 1_000 + DEFAULT_IDLE_MS + 1)

    assert.deepEqual(reaped, ['m_abc'])
    assert.equal(empty.closed, true)
    assert.equal(map.size, 0)
})

test('leaves an empty room alone inside the grace period', () => {
    const fresh = room('m_abc', 0, 1_000)
    const map = rooms(fresh)

    const reaped = reapIdleRooms(map, 1_000 + DEFAULT_IDLE_MS - 1)

    assert.deepEqual(reaped, [])
    assert.equal(fresh.closed, false)
    assert.equal(map.size, 1)
})

test('never reaps a room that still holds peers', () => {
    const busy = room('12', 2, null)
    const map = rooms(busy)

    const reaped = reapIdleRooms(map, Number.MAX_SAFE_INTEGER)

    assert.deepEqual(reaped, [])
    assert.equal(busy.closed, false)
})

test('never reaps a room that has not been marked empty', () => {
    const unmarked = room('12', 0, null)
    const map = rooms(unmarked)

    const reaped = reapIdleRooms(map, Number.MAX_SAFE_INTEGER)

    assert.deepEqual(reaped, [])
    assert.equal(unmarked.closed, false)
})

test('reaps only the rooms that are past the window', () => {
    const stale = room('m_old', 0, 1_000)
    const recent = room('m_new', 0, 9_000)
    const busy = room('12', 1, null)
    const map = rooms(stale, recent, busy)

    const reaped = reapIdleRooms(map, 1_000 + DEFAULT_IDLE_MS + 1)

    assert.deepEqual(reaped, ['m_old'])
    assert.deepEqual([...map.keys()], ['m_new', '12'])
})

test('honours a custom idle window', () => {
    const empty = room('m_abc', 0, 0)
    const map = rooms(empty)

    assert.deepEqual(reapIdleRooms(map, 50, 100), [])
    assert.deepEqual(reapIdleRooms(map, 150, 100), ['m_abc'])
})

test('marks the moment a room becomes empty and keeps the original moment', () => {
    const r = room('m_abc', 0, null)

    markRoomEmptiness(r, 500)
    assert.equal(r.lastEmptyAt, 500)

    markRoomEmptiness(r, 900)
    assert.equal(r.lastEmptyAt, 500, 'the clock starts when the room emptied, not on every sweep')
})

test('clears the mark when a peer joins, resetting the countdown', () => {
    const r = room('m_abc', 0, 500)

    r.peers.size = 1
    markRoomEmptiness(r, 900)

    assert.equal(r.lastEmptyAt, null)
})

test('a room that refills and empties again starts a fresh countdown', () => {
    const r = room('m_abc', 0, null)
    const map = rooms(r)

    markRoomEmptiness(r, 1_000)
    r.peers.size = 1
    markRoomEmptiness(r, 2_000)
    r.peers.size = 0
    markRoomEmptiness(r, 3_000)

    assert.deepEqual(reapIdleRooms(map, 1_000 + DEFAULT_IDLE_MS + 1), [],
        'must not reap based on the first time it emptied')
    assert.deepEqual(reapIdleRooms(map, 3_000 + DEFAULT_IDLE_MS + 1), ['m_abc'])
})
