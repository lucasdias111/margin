import type { Page, Locator } from '@playwright/test'

export class RegisterPage {
  readonly displayNameInput: Locator
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly repeatPasswordInput: Locator
  readonly submitButton: Locator
  readonly backButton: Locator
  readonly successCard: Locator

  constructor(private readonly page: Page) {
    this.displayNameInput = page.locator('#display-name')
    this.emailInput = page.locator('#email')
    this.passwordInput = page.locator('#password')
    this.repeatPasswordInput = page.locator('#repeatPassword')
    this.submitButton = page.getByRole('button', { name: 'Create account' })
    this.backButton = page.getByRole('button', { name: 'Back to sign in' })
    this.successCard = page.locator('.success-card')
  }

  async goto(): Promise<void> {
    await this.page.goto('/#/register')
  }

  async acceptTerms(): Promise<void> {
    await this.page.locator('.checkbox-row').nth(0).locator('input[type="checkbox"]').check({ force: true })
  }

  async acceptPrivacy(): Promise<void> {
    await this.page.locator('.checkbox-row').nth(1).locator('input[type="checkbox"]').check({ force: true })
  }

  async fillAndSubmit(fields: {
    displayName: string
    email: string
    password: string
    repeatPassword?: string
  }): Promise<void> {
    await this.displayNameInput.fill(fields.displayName)
    await this.emailInput.fill(fields.email)
    await this.passwordInput.fill(fields.password)
    await this.repeatPasswordInput.fill(fields.repeatPassword ?? fields.password)
    await this.acceptTerms()
    await this.acceptPrivacy()
    await this.submitButton.click()
  }

  errorTexts(): Locator {
    return this.page.locator('.error-text')
  }
}
