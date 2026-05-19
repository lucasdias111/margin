import type { Locator, Page } from '@playwright/test'

export class HomePage {
  readonly navPrivate: Locator
  readonly navMargin: Locator
  readonly avatarButton: Locator
  readonly marginSwitcher: Locator
  readonly marginSpaces: Locator
  readonly marginEmptyCreate: Locator

  constructor(private readonly page: Page) {
    this.navPrivate = page.locator('[data-tour="nav-private"]')
    this.navMargin = page.locator('[data-tour="nav-margin"]')
    this.avatarButton = page.locator('[data-tour="avatar-btn"]')
    this.marginSwitcher = page.locator('[data-tour="margin-switcher"]')
    this.marginSpaces = page.locator('[data-tour="margin-spaces"]')
    this.marginEmptyCreate = page.locator('[data-tour="margin-empty-create"]')
  }

  async goToPrivate(): Promise<void> {
    await this.navPrivate.click()
  }

  async goToMargin(): Promise<void> {
    await this.navMargin.click()
  }

  async logout(): Promise<void> {
    await this.avatarButton.click()
    await this.page.getByText('Log out').click()
  }

  async joinWithCode(code: string): Promise<void> {
    await this.goToMargin()
    await this.page.locator('.join-input').fill(code)
    await this.page.getByRole('button', { name: 'Join' }).click()
  }

  async selectMargin(marginName: string): Promise<void> {
    await this.marginSwitcher.locator('.switcher-btn').click()
    await this.page.locator('.margin-item', { hasText: marginName }).click()
  }

  async openSpace(spaceName: string): Promise<void> {
    await this.marginSpaces.locator('.space-row', { hasText: spaceName }).click()
  }

  async selectChannel(channelName: string): Promise<void> {
    await this.page.locator('.channel-button', { hasText: channelName }).click()
  }

  chatInput(): Locator {
    return this.page.locator('textarea[placeholder="Type a message..."]')
  }

  async sendMessage(text: string): Promise<void> {
    await this.chatInput().fill(text)
    await this.chatInput().press('Enter')
  }

  onboardingTooltip(): Locator {
    return this.page.locator('.tooltip.ready')
  }
}
