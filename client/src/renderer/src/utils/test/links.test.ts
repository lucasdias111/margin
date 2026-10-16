import { describe, expect, it } from 'vitest'
import { hashRouteForPath } from '../pathRoute'
import { desktopOpenUrl } from '../desktopLink'
import { inviteCodeFrom } from '$src/services/MarginInviteService'
import { rememberPostLoginRoute, takePostLoginRoute } from '../postLoginRoute'
import { passwordProblem } from '../passwordRules'

describe('hashRouteForPath', () => {
  it('maps a shared path link onto the hash route, keeping the query', () => {
    expect(hashRouteForPath('/setup', '?token=abc', '')).toBe('/#/setup?token=abc')
    expect(hashRouteForPath('/meet/xyz/', '', '')).toBe('/#/meet/xyz')
  })

  it('leaves the root and existing hash routes alone', () => {
    expect(hashRouteForPath('/', '', '')).toBeNull()
    expect(hashRouteForPath('/meet/xyz', '', '#/home')).toBeNull()
  })
})

describe('desktopOpenUrl', () => {
  it('wraps the https link for the desktop shell', () => {
    expect(desktopOpenUrl('https://chat.example.com/meet/abc')).toBe(
      'margin://open?url=https%3A%2F%2Fchat.example.com%2Fmeet%2Fabc'
    )
  })
})

describe('inviteCodeFrom', () => {
  it('accepts a pasted invite link or a bare code', () => {
    expect(inviteCodeFrom(' https://chat.example.com/invite/abc123 ')).toBe('abc123')
    expect(inviteCodeFrom('abc123')).toBe('abc123')
  })
})

describe('post-login route', () => {
  it('returns to the remembered page once, then home', () => {
    rememberPostLoginRoute('/invite/abc')
    expect(takePostLoginRoute()).toBe('/invite/abc')
    expect(takePostLoginRoute()).toBe('/home')
  })
})

describe('passwordProblem', () => {
  it('checks length and that both entries match', () => {
    expect(passwordProblem('short', 'short')).toMatch(/8 characters/)
    expect(passwordProblem('longenough', 'different')).toMatch(/match/)
    expect(passwordProblem('longenough', 'longenough')).toBeNull()
  })
})
