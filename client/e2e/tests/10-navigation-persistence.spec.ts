import { expect, test } from '../fixtures'
import { HomePage } from '../pages/HomePage'

test.describe('Navigation persistence', () => {
  test('remembers the open DM and channel when switching between private and margin views', async ({
    authedPage,
    seed
  }) => {
    const home = new HomePage(authedPage)

    await home.goToPrivate()
    await authedPage.locator('.entry', { hasText: seed.bob.displayName }).click()
    await expect(authedPage.locator('.handle', { hasText: seed.bob.displayName })).toBeVisible({
      timeout: 8000
    })

    await home.goToMargin()
    await home.selectMargin(seed.marginName)
    await home.openSpace(seed.spaceName)
    await home.selectChannel(seed.channelName)
    await expect(
      authedPage.locator('.chat .channel-name', { hasText: seed.channelName })
    ).toBeVisible({ timeout: 8000 })

    await home.goToPrivate()
    await expect(authedPage.locator('.handle', { hasText: seed.bob.displayName })).toBeVisible()

    await home.goToMargin()
    await expect(authedPage.locator('.chat .channel-name', { hasText: seed.channelName })).toBeVisible()
  })
})
