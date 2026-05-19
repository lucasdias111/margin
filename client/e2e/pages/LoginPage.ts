import type { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator
  readonly registerLink: Locator

  constructor(private readonly page: Page) {
    this.emailInput = page.locator('#email')
    this.passwordInput = page.locator('#password')
    this.submitButton = page.getByRole('button', { name: 'Sign in' })
    this.errorMessage = page.locator('.error')
    this.registerLink = page.getByRole('button', { name: 'Create an account' })
  }

  async goto(): Promise<void> {
    await this.page.goto('/#/')
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async loginAndWait(email: string, password: string): Promise<void> {
    await this.login(email, password)
    await this.page.waitForURL('**/#/home')
  }
}
