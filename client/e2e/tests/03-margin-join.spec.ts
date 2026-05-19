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
    await expect(home.marginEmptyCreate).toBeVisible()
    await expect(page.getByText('No margin yet')).toBeVisible()
  })

  test('joining with a valid invite code adds the margin', async ({ page, seed }) => {
    const login = new LoginPage(page)
    await login.goto()
    await login.loginAndWait(seed.carol.email, seed.carol.password)

    const home = new HomePage(page)
    await home.joinWithCode(seed.inviteCode)

    await expect(home.marginSwitcher).toBeVisible({ timeout: 8000 })
    await expect(page.getByText(seed.marginName)).toBeVisible()
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
