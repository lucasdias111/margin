import { expect, test } from '../fixtures'
import { LoginPage } from '../pages/LoginPage'

test.describe('Login', () => {
  test('valid credentials redirect to home', async ({ page, seed }) => {
    const login = new LoginPage(page)
    await login.goto()
    await login.loginAndWait(seed.alice.email, seed.alice.password)
    await expect(page).toHaveURL(/\/#\/home/)
  })

  test('wrong password shows error message', async ({ page }) => {
    const login = new LoginPage(page)
    await login.goto()
    await login.login('nobody@e2e.margin', 'wrongpassword')
    await expect(login.errorMessage).toBeVisible()
    await expect(page).not.toHaveURL(/\/#\/home/)
  })

  test('unactivated account shows activation hint', async ({ page }) => {
    const login = new LoginPage(page)
    await login.goto()
    await login.login('notactivated@e2e.margin', 'anypassword')
    await expect(login.errorMessage).toBeVisible()
  })

  test('logout returns to login page', async ({ authedPage }) => {
    const home = authedPage
    await home.locator('[data-tour="avatar-btn"]').click()
    await home.getByText('Log out').click()
    await expect(home).toHaveURL(/\/#\//)
    await expect(home).not.toHaveURL(/\/#\/home/)
  })

  test('navigating to /register shows register form', async ({ page }) => {
    const login = new LoginPage(page)
    await login.goto()
    await login.registerLink.click()
    await expect(page).toHaveURL(/\/#\/register/)
  })
})
