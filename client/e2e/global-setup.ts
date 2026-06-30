import type { FullConfig } from '@playwright/test'
import { writeFileSync } from 'fs'
import { join } from 'path'

const API = 'http://localhost:8080/api'

export const ALICE = {
  email: 'alice@e2e.margin',
  password: 'AliceE2E123!',
  handle: 'alicee2e',
  displayName: 'Alice E2E'
}

export const BOB = {
  email: 'bob@e2e.margin',
  password: 'BobE2E123!',
  handle: 'bobe2e',
  displayName: 'Bob E2E'
}

const CAROL_DISPLAY_NAME = 'Carol E2E'

function makeCarol() {
  const ts = Date.now()
  return {
    email: `carol-${ts}@e2e.margin`,
    password: 'CarolE2E123!',
    handle: `carol${ts}`,
    displayName: CAROL_DISPLAY_NAME
  }
}

async function generateKeys(password: string) {
  const enc = new TextEncoder()
  const passwordData = enc.encode(password)
  const seed = new Uint8Array(await crypto.subtle.digest('SHA-256', passwordData))

  const baseKey = await crypto.subtle.importKey('raw', passwordData, 'PBKDF2', false, [
    'deriveBits'
  ])
  await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: seed, iterations: 100000, hash: 'SHA-256' },
    baseKey,
    256
  )

  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  )
  const pubBytes = await crypto.subtle.exportKey('spki', keyPair.publicKey)
  const privBytes = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
  const publicKey = btoa(String.fromCharCode(...new Uint8Array(pubBytes)))
  const privateKey = btoa(String.fromCharCode(...new Uint8Array(privBytes)))

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const pwKey = await crypto.subtle.importKey('raw', passwordData, 'PBKDF2', false, ['deriveKey'])
  const aesKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    pwKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    enc.encode(privateKey)
  )

  return {
    publicKey,
    encryptedPrivateKey: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv))
  }
}

async function tryLogin(email: string, password: string): Promise<string | null> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.success ? data.token : null
}

async function ensureUser(user: typeof ALICE): Promise<string> {
  const existing = await tryLogin(user.email, user.password)
  if (existing) return existing

  const keys = await generateKeys(user.password)
  const secret = process.env.TEST_ACTIVATION_SECRET ?? 'dev-test-secret'
  const res = await fetch(`${API}/auth/register-and-activate-test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      handle: user.handle,
      displayName: user.displayName,
      email: user.email,
      password: user.password,
      secret,
      ...keys
    })
  })

  if (!res.ok && res.status !== 409) {
    throw new Error(
      `register-and-activate-test failed for ${user.email}: HTTP ${res.status}\n` +
        'Ensure the backend is running with @Profile("dev") and the TestSupportController is loaded.'
    )
  }

  const token = await tryLogin(user.email, user.password)
  if (!token) throw new Error(`Login failed for ${user.email} after registration`)
  return token
}

async function apiGet(path: string, token: string): Promise<any> {
  const res = await fetch(`${API}/${path}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`GET ${path}: HTTP ${res.status}`)
  return res.json()
}

async function apiPost(path: string, token: string, body: unknown = null): Promise<any> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
  const opts: RequestInit = { method: 'POST', headers }
  if (body !== null) {
    headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }
  const res = await fetch(`${API}/${path}`, opts)
  const text = await res.text()
  if (!res.ok) throw new Error(`POST ${path}: HTTP ${res.status} — ${text}`)
  return text ? JSON.parse(text) : null
}

async function seedGroupConversation(aliceToken: string, bobToken: string): Promise<string> {
  const groupName = 'E2E Group'

  const convs: any[] = await apiGet('conversations', aliceToken)
  const existing = convs.find((c: any) => c.type === 'GROUP' && c.name === groupName)

  if (!existing) {
    await apiPost('conversations/group', aliceToken, {
      memberEmails: [BOB.email],
      name: groupName,
      encrypted: false
    })
  }

  const pending: any[] = await apiGet('conversations/pending_invites', bobToken)
  const invite = pending.find(
    (inv: any) => inv.conversation?.type === 'GROUP' && inv.conversation?.name === groupName
  )
  if (invite) {
    await apiPost(`conversations/${invite.conversation.id}/invite/accept`, bobToken)
  }

  return groupName
}

async function seedDmConversation(aliceToken: string, bobToken: string): Promise<void> {
  const inviteRes = await fetch(`${API}/conversations/invite`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: BOB.email, encrypted: false })
  })

  if (!inviteRes.ok && inviteRes.status >= 500) {
    throw new Error(`seedDmConversation invite: HTTP ${inviteRes.status}`)
  }

  const pending: any[] = await apiGet('conversations/pending_invites', bobToken)
  const invite = pending.find(
    (inv: any) => inv.fromUser?.displayName?.toLowerCase() === ALICE.displayName.toLowerCase()
  )
  if (invite) {
    await apiPost(`conversations/${invite.conversation.id}/invite/accept`, bobToken)
  }
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  const CAROL = makeCarol()

  const [aliceToken, bobToken] = await Promise.all([
    ensureUser(ALICE),
    ensureUser(BOB),
    ensureUser(CAROL)
  ])

  const margins: any[] = await apiGet('margins/get_margins', aliceToken)
  let margin = margins.find((m: any) => m.marginName === 'E2E Test Margin')

  if (!margin) {
    const fd = new FormData()
    fd.append(
      'data',
      new Blob(
        [
          JSON.stringify({
            marginName: 'E2E Test Margin',
            marginDescription: 'Playwright seeds',
            visibility: 'PUBLIC'
          })
        ],
        { type: 'application/json' }
      )
    )
    const res = await fetch(`${API}/margins/create_new_margin`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${aliceToken}` },
      body: fd
    })
    if (!res.ok) throw new Error(`create margin: HTTP ${res.status}`)
    margin = await res.json()
  }

  const bobMargins: any[] = await apiGet('margins/get_margins', bobToken)
  if (!bobMargins.some((m: any) => m.marginId === margin.marginId)) {
    const { inviteCode: joinCode } = await apiPost(
      `invites/margins/${margin.marginId}/link`,
      aliceToken
    )
    await apiPost(`invites/join/${joinCode}`, bobToken)
  }

  const marginDetails: any = await apiGet(`margins/get_margin/${margin.marginId}`, aliceToken)
  const staleCarols: any[] = (marginDetails.members ?? []).filter(
    (m: any) => m.user?.displayName === CAROL_DISPLAY_NAME
  )
  await Promise.all(
    staleCarols.map((m: any) =>
      apiPost('margins/remove_margin_member', aliceToken, {
        marginId: margin.marginId,
        userIdToRemove: m.user.id
      })
    )
  )

  const spaces: any[] = await apiGet(
    `spaces/get_all_spaces_for_user/${margin.marginId}`,
    aliceToken
  )
  let space = spaces.find((s: any) => s.spaceName === 'E2E Test Space')

  if (!space) {
    space = await apiPost('spaces/create_space', aliceToken, {
      name: 'E2E Test Space',
      description: 'Playwright seeds',
      visibility: 'PUBLIC',
      marginId: margin.marginId
    })
  }

  let channel = space.channels?.find((c: any) => c.name === 'E2E Test Channel')

  if (!channel) {
    channel = await apiPost('channels/create_channel', aliceToken, {
      name: 'E2E Test Channel',
      description: '',
      spaceId: space.spaceId,
      channelType: 'Communication'
    })
  }

  const { inviteCode } = await apiPost(`invites/margins/${margin.marginId}/link`, aliceToken)

  await seedDmConversation(aliceToken, bobToken)
  const groupName = await seedGroupConversation(aliceToken, bobToken)

  writeFileSync(
    join(process.cwd(), '.e2e-seed.json'),
    JSON.stringify(
      {
        alice: ALICE,
        bob: BOB,
        carol: CAROL,
        marginId: margin.marginId,
        marginName: margin.marginName,
        spaceId: space.spaceId,
        spaceName: space.spaceName ?? 'E2E Test Space',
        channelId: channel.id,
        channelName: channel.name ?? 'E2E Test Channel',
        inviteCode,
        groupName
      },
      null,
      2
    )
  )
}
