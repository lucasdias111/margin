import { describe, expect, it } from 'vitest'
import { base64UrlToBytes, webPushService } from '../WebPushService'

describe('webPushService', () => {
  it("decodes the instance's base64url VAPID key into bytes", () => {
    expect(Array.from(base64UrlToBytes('AP_-'))).toEqual([0x00, 0xff, 0xfe])
  })

  it('stays off where the browser has no push support', async () => {
    expect(webPushService.supported).toBe(false)
    expect(await webPushService.isSubscribed()).toBe(false)
    expect(await webPushService.enable()).toBe(false)
  })
})
