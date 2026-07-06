import { expect, test } from '../fixtures'
import { HomePage } from '../pages/HomePage'

test.describe('Typing indicator', () => {
  test('Bob sees Alice typing in their DM, and sees it disappear when she stops', async ({
    twoUsers
  }) => {
    const { alice: alicePage, bob: bobPage, seed } = twoUsers

    const aliceHome = new HomePage(alicePage)
    await aliceHome.goToPrivate()
    await alicePage.locator('.entry', { hasText: seed.bob.displayName }).click()

    const bobHome = new HomePage(bobPage)
    await bobHome.goToPrivate()
    await bobPage.locator('.entry', { hasText: seed.alice.displayName }).click()

    await aliceHome.chatInput().fill(`Hi Bob ${Date.now()}`)

    await expect(bobHome.typingIndicator()).toBeVisible({ timeout: 8000 })
    await expect(bobHome.typingIndicator()).toContainText(seed.alice.displayName)

    await aliceHome.chatInput().fill('')

    await expect(bobHome.typingIndicator()).toBeHidden({ timeout: 8000 })
  })

  test('Bob sees Alice typing in their shared group', async ({ twoUsers }) => {
    const { alice: alicePage, bob: bobPage, seed } = twoUsers

    const aliceHome = new HomePage(alicePage)
    await aliceHome.goToPrivate()
    await alicePage.locator('.group-entry', { hasText: seed.groupName }).click({ timeout: 6000 })

    const bobHome = new HomePage(bobPage)
    await bobHome.goToPrivate()
    await bobPage.locator('.group-entry', { hasText: seed.groupName }).click({ timeout: 6000 })

    await aliceHome.chatInput().fill(`Group typing ${Date.now()}`)

    await expect(bobHome.typingIndicator()).toBeVisible({ timeout: 8000 })
    await expect(bobHome.typingIndicator()).toContainText(seed.alice.displayName)

    await aliceHome.chatInput().fill('')

    await expect(bobHome.typingIndicator()).toBeHidden({ timeout: 8000 })
  })

  test('Bob sees Alice typing in their shared channel', async ({ twoUsers }) => {
    const { alice: alicePage, bob: bobPage, seed } = twoUsers

    const aliceHome = new HomePage(alicePage)
    await aliceHome.goToMargin()
    await aliceHome.selectMargin(seed.marginName)
    await aliceHome.openSpace(seed.spaceName)
    await aliceHome.selectChannel(seed.channelName)

    const bobHome = new HomePage(bobPage)
    await bobHome.goToMargin()
    await bobHome.selectMargin(seed.marginName)
    await bobHome.openSpace(seed.spaceName)
    await bobHome.selectChannel(seed.channelName)

    await aliceHome.chatInput().fill(`Channel typing ${Date.now()}`)

    await expect(bobHome.typingIndicator()).toBeVisible({ timeout: 8000 })
    await expect(bobHome.typingIndicator()).toContainText(seed.alice.displayName)

    await aliceHome.chatInput().fill('')

    await expect(bobHome.typingIndicator()).toBeHidden({ timeout: 8000 })
  })
})
