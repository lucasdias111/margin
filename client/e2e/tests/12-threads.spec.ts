import { test, expect } from '../fixtures'
import { HomePage } from '../pages/HomePage'
import type { Page } from '@playwright/test'

async function openThreadChannel(
  page: Page,
  seed: { marginName: string; spaceName: string; threadChannelName: string }
): Promise<HomePage> {
  const home = new HomePage(page)
  await home.goToMargin()
  await home.selectMargin(seed.marginName)
  await home.openSpace(seed.spaceName)
  await home.selectChannel(seed.threadChannelName)
  return home
}

async function createPost(page: Page, title: string, body: string): Promise<void> {
  await page.locator('.new-post-btn').click()
  await page.locator('.post-title-input').fill(title)
  await page.locator('.post-body-input').fill(body)
  await page.getByRole('button', { name: 'Post', exact: true }).click()
  await expect(page.locator('.post-view')).toBeVisible({ timeout: 8000 })
}

async function sendReply(page: Page, text: string): Promise<void> {
  const input = page.locator('.post-view textarea')
  await input.fill(text)
  await input.press('Enter')
}

test.describe('Thread channels', () => {
  test('creating a post opens it and shows the body', async ({ authedPage, seed }) => {
    const title = `Post ${Date.now()}`
    const body = `Body ${Date.now()}`

    await openThreadChannel(authedPage, seed)
    await createPost(authedPage, title, body)

    await expect(authedPage.locator('.post-view .post-title')).toHaveText(title)
    await expect(
      authedPage.locator('.post-view .post-body .post-text', { hasText: body })
    ).toBeVisible({ timeout: 8000 })
  })

  test('posts appear in the channel post list with reply counts', async ({ authedPage, seed }) => {
    const title = `Listed post ${Date.now()}`
    const reply = `Listed reply ${Date.now()}`

    await openThreadChannel(authedPage, seed)
    await createPost(authedPage, title, `body for ${title}`)
    await sendReply(authedPage, reply)
    await expect(
      authedPage.locator('.post-view .bubble p.text', { hasText: reply })
    ).toBeVisible({ timeout: 8000 })

    await authedPage.locator('.post-view .back-btn').click()
    const item = authedPage.locator('.post-item', { hasText: title })
    await expect(item).toBeVisible()
    await expect(item.locator('.post-replies')).toContainText('1 reply', { timeout: 8000 })
  })

  test('second user sees the post, replies live, and the author is notified', async ({
    twoUsers,
  }) => {
    const { alice: alicePage, bob: bobPage, seed } = twoUsers
    const title = `Shared post ${Date.now()}`
    const bobReply = `Bob reply ${Date.now()}`

    await openThreadChannel(alicePage, seed)
    await createPost(alicePage, title, `body for ${title}`)

    await openThreadChannel(bobPage, seed)
    const bobItem = bobPage.locator('.post-item', { hasText: title })
    await expect(bobItem).toBeVisible({ timeout: 10000 })

    await bobItem.click()
    await expect(bobPage.locator('.post-view')).toBeVisible()
    await sendReply(bobPage, bobReply)
    await expect(
      alicePage.locator('.post-view .bubble p.text', { hasText: bobReply })
    ).toBeVisible({ timeout: 10000 })

    await bobPage.locator('.post-view .post-body .action-btn.emoji').first().click()
    await expect(
      alicePage.locator('.post-view .post-body .reactions .pill', { hasText: '👍' })
    ).toBeVisible({ timeout: 10000 })

    await alicePage.locator('[aria-label="Notifications"]').click()
    const notification = alicePage
      .locator('.notification-item', { hasText: 'replied in a thread you follow' })
      .first()
    await expect(notification).toBeVisible({ timeout: 10000 })

    await notification.click()
    await expect(alicePage.locator('.post-view .post-title')).toHaveText(title, {
      timeout: 10000,
    })
    await expect(
      alicePage.locator('.post-view .bubble p.text', { hasText: bobReply })
    ).toBeVisible({ timeout: 10000 })
  })

  test('the post body is visually distinct from its replies', async ({ authedPage, seed }) => {
    const title = `Distinct post ${Date.now()}`
    const body = `Distinct body ${Date.now()}`
    const reply = `Distinct reply ${Date.now()}`

    await openThreadChannel(authedPage, seed)
    await createPost(authedPage, title, body)
    await sendReply(authedPage, reply)

    const postBody = authedPage.locator('.post-view .post-body')
    await expect(postBody).toHaveCount(1)
    await expect(postBody.locator('.post-text')).toHaveText(body)
    await expect(postBody.locator('.post-actions .action-btn.emoji').first()).toBeVisible()
    await expect(postBody.locator('.post-actions .action-btn.edit')).toBeVisible()
    await expect(authedPage.locator('.post-view .replies-divider')).toContainText('1 reply', {
      timeout: 8000,
    })
    await expect(
      authedPage.locator('.post-view .message-row .bubble p.text', { hasText: reply })
    ).toBeVisible()
    await expect(authedPage.locator('.post-view .top-status__start')).toHaveCount(0)
  })
})
