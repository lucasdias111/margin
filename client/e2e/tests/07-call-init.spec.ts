import { expect, test } from '../fixtures'

// Stubs navigator.mediaDevices so no real microphone/camera is required.
// Must be injected via addInitScript BEFORE any page navigation.
// addEventListener/removeEventListener are needed by DeviceService.startListening().
const stubMediaDevices = `
  (() => {
    const listeners = {};
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: () => Promise.resolve(new MediaStream()),
        enumerateDevices: () => Promise.resolve([]),
        addEventListener: (type, fn) => {
          (listeners[type] = listeners[type] || []).push(fn);
        },
        removeEventListener: (type, fn) => {
          if (listeners[type]) listeners[type] = listeners[type].filter(h => h !== fn);
        },
        dispatchEvent: () => true,
      },
      writable: true,
    });
  })();
`

const skipOnboarding = `
  localStorage.setItem('margin.onboarding.v2', JSON.stringify({ completed: [], skippedAll: true }));
`

test.describe('Call initiation', () => {
  test('Alice initiates a voice call and IncomingCallModal appears for Bob', async ({
    browser,
    seed,
  }) => {
    const aliceCtx = await browser.newContext()
    const bobCtx = await browser.newContext()
    const alicePage = await aliceCtx.newPage()
    const bobPage = await bobCtx.newPage()

    await alicePage.addInitScript(stubMediaDevices)
    await alicePage.addInitScript(skipOnboarding)
    await bobPage.addInitScript(stubMediaDevices)
    await bobPage.addInitScript(skipOnboarding)

    // Register WS-connected watchers BEFORE navigation so the event isn't missed
    const aliceWsReady = alicePage.waitForEvent('console', {
      predicate: (msg) => msg.text() === 'WebSocket connected',
      timeout: 15000,
    })
    const bobWsReady = bobPage.waitForEvent('console', {
      predicate: (msg) => msg.text() === 'WebSocket connected',
      timeout: 15000,
    })

    // Login Alice
    await alicePage.goto('/#/')
    await alicePage.fill('#email', seed.alice.email)
    await alicePage.fill('#password', seed.alice.password)
    await alicePage.click('button:has-text("Sign in")')
    await alicePage.waitForURL('**/#/home')

    // Login Bob
    await bobPage.goto('/#/')
    await bobPage.fill('#email', seed.bob.email)
    await bobPage.fill('#password', seed.bob.password)
    await bobPage.click('button:has-text("Sign in")')
    await bobPage.waitForURL('**/#/home')

    // Both WebSocket connections must be open before the call attempt
    await aliceWsReady
    await bobWsReady

    // Alice navigates to her DM with Bob
    await alicePage.locator('[data-tour="nav-private"]').click()
    await alicePage.locator('.user-button', { hasText: seed.bob.displayName }).click()

    // Click the voice call button (aria-label from PrivateChatHeader)
    const callButton = alicePage.locator('button[aria-label="Start voice call"]')
    await expect(callButton).toBeVisible({ timeout: 6000 })
    await callButton.click()

    // Bob should see the IncomingCallModal (role="dialog" aria-modal="true")
    await expect(bobPage.getByRole('dialog')).toBeVisible({ timeout: 20000 })
    await expect(bobPage.getByText('Incoming call')).toBeVisible()

    await aliceCtx.close()
    await bobCtx.close()
  })
})
