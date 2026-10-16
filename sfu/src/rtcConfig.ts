export const DEFAULT_RTC_PORT = 40000

export interface RtcConfig {
    announcedAddress: string
    port: number
}

// The media address can't be auto-detected: inside a bridge network the
// container only sees its own private IP, which clients can't reach.
export function readRtcConfig(env: NodeJS.ProcessEnv): RtcConfig {
    const announcedAddress = (env.ANNOUNCED_IP || env.PUBLIC_IP || '').trim()
    if (!announcedAddress) {
        throw new Error('ANNOUNCED_IP (or PUBLIC_IP) must be set to the address clients reach for media')
    }

    const rawPort = env.MEDIASOUP_RTC_PORT?.trim() || String(DEFAULT_RTC_PORT)
    const port = Number(rawPort)
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(`MEDIASOUP_RTC_PORT must be a port number, got "${rawPort}"`)
    }

    return {announcedAddress, port}
}
