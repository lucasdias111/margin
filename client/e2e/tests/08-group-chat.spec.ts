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

  test('Alice creates a group with Bob and sends a message that Bob sees', async ({
    twoUsers
  }) => {
    const { alice: alicePage, bob: bobPage, seed } = twoUsers

    const aliceHome = new HomePage(alicePage)
    await aliceHome.goToPrivate()

    // Open group chat modal
    await alicePage.locator('.new-chat-btn').click()
    await alicePage.locator('.dropdown-item', { hasText: 'Group chat' }).click()

    // Add Bob by email
    await alicePage.locator('#member-email-input').fill(seed.bob.email)
    await alicePage.getByRole('button', { name: 'Add' }).click()
    await expect(
      alicePage.locator('.member-chip', { hasText: seed.bob.displayName })
    ).toBeVisible({ timeout: 4000 })

    // Set group name
    await alicePage.locator('#group-name-input').fill('Test Group')

    // Create
    await alicePage.getByRole('button', { name: 'Create' }).click()
    await expect(alicePage.locator('.modal-overlay')).not.toBeVisible({ timeout: 6000 })

    // Alice sends a message
    const msg = `Group hello ${Date.now()}`
    await aliceHome.sendMessage(msg)

    // Bob accepts the invite
    const bobHome = new HomePage(bobPage)
    await bobHome.goToPrivate()

    await bobPage
      .locator('.invite-item', { hasText: 'Test Group' })
      .locator('button', { hasText: 'Accept' })
      .click({ timeout: 10000 })

    // Bob should now see the group and the message
    await bobPage.locator('.group-entry', { hasText: 'Test Group' }).click({ timeout: 6000 })

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
