import { expect, test } from '../fixtures'
import { HomePage } from '../pages/HomePage'

test.describe('Direct messages', () => {
  test('New conversation modal finds a user by email', async ({ authedPage, seed }) => {
    const home = new HomePage(authedPage)
    await home.goToPrivate()

    await authedPage.locator('.new-chat-btn').click()
    await authedPage.locator('.dropdown-item', { hasText: 'Private chat' }).click()

    await authedPage.locator('#email-input').fill(seed.bob.email)
    await authedPage.getByRole('button', { name: 'Find' }).click()

    await expect(authedPage.locator('.name', { hasText: seed.bob.displayName })).toBeVisible({
      timeout: 6000
    })
  })

  test('Alice sends a message that Bob sees', async ({ twoUsers }) => {
    const { alice: alicePage, bob: bobPage, seed } = twoUsers
    const msg = `Hello Bob ${Date.now()}`

    const aliceHome = new HomePage(alicePage)
    await aliceHome.goToPrivate()
    await alicePage.locator('.entry', { hasText: seed.bob.displayName }).click()

    await aliceHome.sendMessage(msg)

    const bobHome = new HomePage(bobPage)
    await bobHome.goToPrivate()
    await bobPage.locator('.entry', { hasText: seed.alice.displayName }).click()

    await expect(bobPage.locator('.bubble p.text', { hasText: msg })).toBeVisible({
      timeout: 10000
    })
  })
})
