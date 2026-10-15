import { expect, test } from '../fixtures'
import { LoginPage } from '../pages/LoginPage'
import { HomePage } from '../pages/HomePage'

test.describe('Onboarding tour', () => {
  test('nav-intro flow appears after first login', async ({ browser, seed }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()

    const login = new LoginPage(page)
    await login.goto()
    await login.loginAndWait(seed.alice.email, seed.alice.password)

    const home = new HomePage(page)

    await expect(home.onboardingTooltip()).toBeVisible({ timeout: 6000 })
    await expect(home.onboardingTooltip().locator('h3')).toHaveText('Private chats')

    await ctx.close()
  })

  test('"Next" advances to the next step', async ({ browser, seed }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()

    const login = new LoginPage(page)
    await login.goto()
    await login.loginAndWait(seed.alice.email, seed.alice.password)

    const home = new HomePage(page)
    await expect(home.onboardingTooltip()).toBeVisible({ timeout: 6000 })

    await page.getByRole('button', { name: 'Next' }).click()
    await expect(home.onboardingTooltip().locator('h3')).toHaveText('Margins')

    await ctx.close()
  })

  test('"Skip" completes the current flow and advances to the next', async ({ browser, seed }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()

    const login = new LoginPage(page)
    await login.goto()
    await login.loginAndWait(seed.alice.email, seed.alice.password)

    const home = new HomePage(page)
    await expect(home.onboardingTooltip()).toBeVisible({ timeout: 6000 })
    await expect(home.onboardingTooltip().locator('h3')).toHaveText('Private chats')

    await page.getByRole('button', { name: 'Skip', exact: true }).click()

    await expect(home.onboardingTooltip().locator('h3')).not.toHaveText('Private chats')

    await ctx.close()
  })

  test('"Skip all" hides the tour permanently for the session', async ({ browser, seed }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()

    const login = new LoginPage(page)
    await login.goto()
    await login.loginAndWait(seed.alice.email, seed.alice.password)

    const home = new HomePage(page)
    await expect(home.onboardingTooltip()).toBeVisible({ timeout: 6000 })

    await page.getByRole('button', { name: 'Skip all' }).click()
    await expect(home.onboardingTooltip()).not.toBeVisible()

    await home.goToMargin()
    await expect(home.onboardingTooltip()).not.toBeVisible()

    await ctx.close()
  })

  test('data-tour targets exist in the DOM', async ({ authedPage }) => {
    for (const attr of ['nav-private', 'nav-margin', 'avatar-btn']) {
      await expect(authedPage.locator(`[data-tour="${attr}"]`)).toBeAttached()
    }
  })
})
