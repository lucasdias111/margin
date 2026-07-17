import { expect, test } from '../fixtures'

const API = 'http://localhost:8080/api'
const WS_URL = 'ws://localhost:8081/ws'

const skipOnboarding = `
  localStorage.setItem('margin.onboarding.v2', JSON.stringify({ completed: [], skippedAll: true }));
`

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!data.success) throw new Error(`Login failed for ${email}`)
  return data.token
}

async function getUserId(token: string): Promise<number> {
  const res = await fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
  const user = await res.json()
  return user.id
}

test.describe('Channel call invite', () => {
  // Alice's side is driven over a raw WebSocket: the in-app "Invite" button only
  // renders while she is inside a live SFU call, which the e2e stack doesn't run.
  // The server-side authorization + forwarding and Bob's full UI are still real.
  test('invite shows a channel-labelled modal for Bob and Decline dismisses it', async ({
    browser,
    seed,
  }) => {
    const bobCtx = await browser.newContext()
    const bobPage = await bobCtx.newPage()
    await bobPage.addInitScript(skipOnboarding)

    const bobWsReady = bobPage.waitForEvent('console', {
      predicate: (msg) => msg.text() === 'WebSocket connected',
      timeout: 15000,
    })

    await bobPage.goto('/#/')
    await bobPage.fill('#email', seed.bob.email)
    await bobPage.fill('#password', seed.bob.password)
    await bobPage.click('button:has-text("Sign in")')
    await bobPage.waitForURL('**/#/home')
    await bobWsReady

    const aliceToken = await login(seed.alice.email, seed.alice.password)
    const bobToken = await login(seed.bob.email, seed.bob.password)
    const bobId = await getUserId(bobToken)

    const aliceWs = new WebSocket(`${WS_URL}?token=${aliceToken}`)
    await new Promise<void>((resolve, reject) => {
      aliceWs.onopen = () => resolve()
      aliceWs.onerror = () => reject(new Error('Alice WS failed to connect'))
    })
    aliceWs.send(
      JSON.stringify({
        type: 'CHANNEL_CALL_INVITE',
        recipientId: bobId,
        payload: String(seed.channelId),
      })
    )

    const modal = bobPage.locator('.modal')
    await expect(modal).toBeVisible({ timeout: 10000 })
    await expect(modal.locator('.name')).toHaveText(seed.alice.displayName)
    await expect(modal.locator('.subtitle')).toHaveText('Channel call invite')
    await expect(modal.locator('.channel-name')).toHaveText(`# ${seed.channelName}`)
    await expect(modal.getByRole('button', { name: 'Join' })).toBeVisible()

    await modal.getByRole('button', { name: 'Decline' }).click()
    await expect(modal).toHaveCount(0)

    aliceWs.close()
    await bobCtx.close()
  })
})
