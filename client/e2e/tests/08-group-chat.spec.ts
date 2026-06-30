import { expect, test } from '../fixtures'
import { HomePage } from '../pages/HomePage'

test.describe('Group chat', () => {
  test('Plus button opens dropdown with Private chat and Group chat options', async ({
    authedPage
  }) => {
    const home = new HomePage(authedPage)
    await home.goToPrivate()

    await authedPage.locator('.new-chat-btn').click()

    await expect(authedPage.locator('.dropdown-item', { hasText: 'Private chat' })).toBeVisible()
    await expect(authedPage.locator('.dropdown-item', { hasText: 'Group chat' })).toBeVisible()
  })

  test('Private chat option opens New Conversation modal', async ({ authedPage }) => {
    const home = new HomePage(authedPage)
    await home.goToPrivate()

    await authedPage.locator('.new-chat-btn').click()
    await authedPage.locator('.dropdown-item', { hasText: 'Private chat' }).click()

    await expect(authedPage.locator('.modal-overlay')).toBeVisible({ timeout: 4000 })
    await expect(authedPage.locator('.modal-title', { hasText: 'New Private Chat' })).toBeVisible()
  })

  test('Group chat option opens New Group Chat modal', async ({ authedPage }) => {
    const home = new HomePage(authedPage)
    await home.goToPrivate()

    await authedPage.locator('.new-chat-btn').click()
    await authedPage.locator('.dropdown-item', { hasText: 'Group chat' }).click()

    await expect(authedPage.locator('.modal-overlay')).toBeVisible({ timeout: 4000 })
    await expect(authedPage.locator('.modal-title', { hasText: /New.*Group/ })).toBeVisible()
  })

  test('Alice sends a message in a group that Bob sees', async ({ twoUsers }) => {
    const { alice: alicePage, bob: bobPage, seed } = twoUsers

    // Alice navigates to the pre-seeded group
    const aliceHome = new HomePage(alicePage)
    await aliceHome.goToPrivate()
    await alicePage.locator('.group-entry', { hasText: seed.groupName }).click({ timeout: 6000 })

    const msg = `Group hello ${Date.now()}`
    await aliceHome.sendMessage(msg)

    // Bob navigates to the same group
    const bobHome = new HomePage(bobPage)
    await bobHome.goToPrivate()
    await bobPage.locator('.group-entry', { hasText: seed.groupName }).click({ timeout: 6000 })

    await expect(bobPage.locator('.bubble p.text', { hasText: msg })).toBeVisible({
      timeout: 10000
    })
  })

  test('Secret chat toggle shows Secret badge in New Conversation modal', async ({
    authedPage
  }) => {
    const home = new HomePage(authedPage)
    await home.goToPrivate()

    await authedPage.locator('.new-chat-btn').click()
    await authedPage.locator('.dropdown-item', { hasText: 'Private chat' }).click()

    await authedPage.locator('label', { hasText: 'Secret Chat' }).click()

    await expect(authedPage.locator('.modal-title', { hasText: 'New Secret Chat' })).toBeVisible({
      timeout: 3000
    })
  })

  test('Secret group toggle shows Secret badge in New Group Chat modal', async ({
    authedPage
  }) => {
    const home = new HomePage(authedPage)
    await home.goToPrivate()

    await authedPage.locator('.new-chat-btn').click()
    await authedPage.locator('.dropdown-item', { hasText: 'Group chat' }).click()

    await authedPage.locator('label', { hasText: 'Secret Group' }).click()

    await expect(
      authedPage.locator('.modal-title', { hasText: 'New Secret Group' })
    ).toBeVisible({ timeout: 3000 })
  })
})
