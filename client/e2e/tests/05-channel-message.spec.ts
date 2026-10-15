import { test, expect } from '../fixtures'
import { HomePage } from '../pages/HomePage'

test.describe('Channel messages', () => {
  test('Alice sends a message that appears in the channel', async ({ authedPage, seed }) => {
    const home = new HomePage(authedPage)
    const msg = `Channel ping ${Date.now()}`

    await home.goToMargin()
    await home.selectMargin(seed.marginName)
    await home.openSpace(seed.spaceName)
    await home.selectChannel(seed.channelName)

    await home.sendMessage(msg)

    await expect(authedPage.locator('.bubble p.text', { hasText: msg })).toBeVisible({
      timeout: 8000,
    })
  })

  test('Bob sees a message Alice sends in the same channel', async ({ twoUsers }) => {
    const { alice: alicePage, bob: bobPage, seed } = twoUsers
    const msg = `Bob sees this ${Date.now()}`

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

    await expect(
      bobPage.locator('.chat .channel-name', { hasText: seed.channelName }).first()
    ).toBeVisible()

    await aliceHome.sendMessage(msg)

    await expect(bobPage.locator('.bubble p.text', { hasText: msg })).toBeVisible({
      timeout: 10000,
    })
  })
})
