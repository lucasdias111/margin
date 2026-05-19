import { test as base, type Page, type Browser } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'path'

export type Seed = {
  alice: { email: string; password: string; handle: string; displayName: string }
  bob: { email: string; password: string; handle: string; displayName: string }
  carol: { email: string; password: string; handle: string; displayName: string }
  marginId: number
  marginName: string
  spaceId: number
  spaceName: string
  channelId: number
  channelName: string
  inviteCode: string
}

function readSeed(): Seed {
  return JSON.parse(readFileSync(join(process.cwd(), '.e2e-seed.json'), 'utf-8'))
}

async function loginAs(page: Page, email: string, password: string): Promise<void> {
  // Suppress the onboarding tour — its tooltip intercepts pointer events
  await page.addInitScript(() => {
    localStorage.setItem('margin.onboarding.v2', JSON.stringify({ completed: [], skippedAll: true }))
  })
  await page.goto('/#/')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button:has-text("Sign in")')
  await page.waitForURL('**/#/home')
}

type Fixtures = {
  seed: Seed
  authedPage: Page
  twoUsers: { alice: Page; bob: Page; seed: Seed }
}

type WorkerFixtures = {
  browser: Browser
}

export const test = base.extend<Fixtures, WorkerFixtures>({
  seed: async ({}, use) => {
    await use(readSeed())
  },

  authedPage: async ({ page, seed }, use) => {
    await loginAs(page, seed.alice.email, seed.alice.password)
    await use(page)
  },

  twoUsers: async ({ browser, seed }, use) => {
    const aliceCtx = await browser.newContext()
    const bobCtx = await browser.newContext()
    const alicePage = await aliceCtx.newPage()
    const bobPage = await bobCtx.newPage()

    await Promise.all([
      loginAs(alicePage, seed.alice.email, seed.alice.password),
      loginAs(bobPage, seed.bob.email, seed.bob.password),
    ])

    await use({ alice: alicePage, bob: bobPage, seed })

    await aliceCtx.close()
    await bobCtx.close()
  },
})

export { expect } from '@playwright/test'
