import { expect, test } from '../fixtures'

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

    await alicePage.goto('/#/')
    await alicePage.fill('#email', seed.alice.email)
    await alicePage.fill('#password', seed.alice.password)
    await alicePage.click('button:has-text("Sign in")')
    await alicePage.waitForURL('**/#/home')

    await bobPage.goto('/#/')
    await bobPage.fill('#email', seed.bob.email)
    await bobPage.fill('#password', seed.bob.password)
    await bobPage.click('button:has-text("Sign in")')
    await bobPage.waitForURL('**/#/home')

    await alicePage.locator('[data-tour="nav-private"]').click()
    await alicePage.locator('.user-button', { hasText: seed.bob.displayName }).click()

    const callButton = alicePage.locator('button[aria-label="Start voice call"]')
    await expect(callButton).toBeVisible({ timeout: 6000 })
    await callButton.click()

    await expect(bobPage.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    await expect(bobPage.getByText('Incoming call')).toBeVisible()

    await aliceCtx.close()
    await bobCtx.close()
  })
})
