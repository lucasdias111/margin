import test from 'node:test'
import assert from 'node:assert/strict'
import {DEFAULT_RTC_PORT, readRtcConfig} from './rtcConfig.ts'

test('uses ANNOUNCED_IP and the default port', () => {
    assert.deepEqual(readRtcConfig({ANNOUNCED_IP: '203.0.113.10'}), {
        announcedAddress: '203.0.113.10',
        port: DEFAULT_RTC_PORT
    })
})

test('falls back to PUBLIC_IP', () => {
    assert.equal(readRtcConfig({PUBLIC_IP: '203.0.113.20'}).announcedAddress, '203.0.113.20')
})

test('prefers ANNOUNCED_IP over PUBLIC_IP', () => {
    const config = readRtcConfig({ANNOUNCED_IP: '203.0.113.10', PUBLIC_IP: '203.0.113.20'})
    assert.equal(config.announcedAddress, '203.0.113.10')
})

test('fails when no address is set', () => {
    assert.throws(() => readRtcConfig({}), /ANNOUNCED_IP/)
    assert.throws(() => readRtcConfig({ANNOUNCED_IP: '  ', PUBLIC_IP: ''}), /ANNOUNCED_IP/)
})

test('reads MEDIASOUP_RTC_PORT', () => {
    assert.equal(readRtcConfig({PUBLIC_IP: '203.0.113.10', MEDIASOUP_RTC_PORT: '41000'}).port, 41000)
})

test('rejects an invalid port', () => {
    for (const port of ['abc', '0', '70000', '4000.5']) {
        assert.throws(() => readRtcConfig({PUBLIC_IP: '203.0.113.10', MEDIASOUP_RTC_PORT: port}), /MEDIASOUP_RTC_PORT/)
    }
})
