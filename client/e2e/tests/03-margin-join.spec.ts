import { expect, test } from '../fixtures'
import { LoginPage } from '../pages/LoginPage'
import { HomePage } from '../pages/HomePage'

test.describe('Join a margin', () => {
  test('user with no margins sees the empty state', async ({ page, seed }) => {
    const login = new LoginPage(page)
    await login.goto()
    await login.loginAndWait(seed.carol.email, seed.carol.password)

    const home = new HomePage(page)
    await home.goToMargin()
    // isMemberOfAnyMargins starts true before loadMarginsForUser resolves — allow time to settle
    await expect(home.marginEmptyCreate).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('No margin yet')).toBeVisible()
  })

  test('joining with a valid invite code adds the margin', async ({ page, seed }) => {
    // Generate a fresh invite code in the test-runner process (Node fetch, no CORS, no stale code risk)
    const loginRes = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: seed.alice.email, password: seed.alice.password }),
    })
    const loginData = await loginRes.json()
    if (!loginData.success) throw new Error(`Alice login failed: ${loginData.message}`)

    const inviteRes = await fetch(
      `http://localhost:8080/api/invites/margins/${seed.marginId}/link`,
      { method: 'POST', headers: { Authorization: `Bearer ${loginData.token}` } },
    )
    const inviteData = await inviteRes.json()
    if (!inviteData.inviteCode) throw new Error('Failed to generate invite code')
    const inviteCode: string = inviteData.inviteCode

    // Suppress onboarding to prevent tooltip from intercepting clicks
    await page.addInitScript(() => {
      localStorage.setItem('margin.onboarding.v2', JSON.stringify({ completed: [], skippedAll: true }))
    })
    const login = new LoginPage(page)
    await login.goto()
    await login.loginAndWait(seed.carol.email, seed.carol.password)

    const home = new HomePage(page)
    await home.goToMargin()

    // isMemberOfAnyMargins starts true — wait for NoMarginEmptyState to be present
    await expect(page.getByText('No margin yet')).toBeVisible({ timeout: 8000 })

    await page.locator('.join-input').fill(inviteCode)
    await page.locator('.empty-state').getByRole('button', { name: 'Join' }).click()

    // Disappears when addNewMargin() → select() sets isMemberOfAnyMargins = true
    await expect(page.getByText('No margin yet')).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByText(seed.marginName)).toBeVisible({ timeout: 5000 })
  })

  test('invalid invite code shows error', async ({ authedPage }) => {
    const home = new HomePage(authedPage)
    await home.goToMargin()

    await authedPage.locator('.switcher-btn').click()

    const joinInput = authedPage.locator('[data-tour="margin-switcher"] .join-input')
    await expect(joinInput).toBeVisible()
    await joinInput.fill('invalid-code-xyz')
    await authedPage
      .locator('[data-tour="margin-switcher"]')
      .getByRole('button', { name: 'Join' })
      .click()

    await expect(authedPage.locator('[data-tour="margin-switcher"] .join-error')).toBeVisible()
    await expect(authedPage.getByText('Invalid or expired code')).toBeVisible()
  })
})