import { expect, test } from '../fixtures'
import { RegisterPage } from '../pages/RegisterPage'

test.describe('Registration', () => {
  test('submitting empty form shows validation errors', async ({ page }) => {
    const reg = new RegisterPage(page)
    await reg.goto()
    await reg.submitButton.click()
    await expect(reg.errorTexts().first()).toBeVisible()
  })

  test('handle shorter than 3 characters shows error', async ({ page }) => {
    const reg = new RegisterPage(page)
    await reg.goto()
    await reg.handleInput.fill('ab')
    await reg.handleInput.blur()
    await expect(reg.errorTexts().filter({ hasText: 'at least 3' })).toBeVisible()
  })

  test('handle with spaces is sanitized automatically', async ({ page }) => {
    const reg = new RegisterPage(page)
    await reg.goto()
    await reg.handleInput.pressSequentially('alice test')
    await expect(reg.handleInput).toHaveValue('alicetest')
  })

  test('mismatched passwords shows error', async ({ page }) => {
    const reg = new RegisterPage(page)
    await reg.goto()
    await reg.passwordInput.fill('Password123!')
    await reg.repeatPasswordInput.fill('Password999!')
    await reg.repeatPasswordInput.blur()
    await expect(reg.errorTexts().filter({ hasText: "don't match" })).toBeVisible()
  })

  test('successful registration shows email confirmation card', async ({ page }) => {
    const reg = new RegisterPage(page)
    await reg.goto()
    const email = `test-${Date.now()}@e2e.margin`
    await reg.fillAndSubmit({
      displayName: 'Test User',
      handle: `testuser${Date.now().toString().slice(-6)}`,
      email,
      password: 'TestPass123!'
    })
    await expect(reg.successCard).toBeVisible()
    await expect(page.getByText('Check your email')).toBeVisible()
    await expect(page.getByText(email)).toBeVisible()
  })

  test('back to sign in button navigates to login', async ({ page }) => {
    const reg = new RegisterPage(page)
    await reg.goto()
    await reg.backButton.click()
    await expect(page).toHaveURL(/\/#\//)
  })
})
