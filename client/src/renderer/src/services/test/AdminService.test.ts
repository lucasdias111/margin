import { beforeEach, describe, expect, it, vi } from 'vitest'
import { adminService } from '../AdminService'
import { authenticatedGet, authenticatedPatch, authenticatedPost } from '$src/services/api'
import { instanceService } from '$src/services/InstanceService'

vi.mock('$src/services/api', () => ({
  authenticatedGet: vi.fn(),
  authenticatedPatch: vi.fn(),
  authenticatedPost: vi.fn(),
  authenticatedDelete: vi.fn()
}))
vi.mock('$src/services/InstanceService', () => ({
  instanceService: { reload: vi.fn() }
}))

function ok(body: unknown): Response {
  return { ok: true, json: async () => body } as Response
}

describe('adminService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('refreshes the public instance info after saving settings', async () => {
    vi.mocked(authenticatedPatch).mockResolvedValue(ok({ registrationMode: 'OPEN' }))

    await adminService.updateSettings({ registrationMode: 'OPEN' })

    expect(authenticatedPatch).toHaveBeenCalledWith({ registrationMode: 'OPEN' }, 'admin/settings')
    expect(instanceService.reload).toHaveBeenCalled()
  })

  it("returns a new account's set-password link", async () => {
    vi.mocked(authenticatedPost).mockResolvedValue(
      ok({ userId: 9, setPasswordLink: 'https://chat.example.com/reset-password/t' })
    )

    expect(await adminService.createUser('Ana', 'ana@example.com')).toBe(
      'https://chat.example.com/reset-password/t'
    )
  })

  it('approves an account by making it active', async () => {
    vi.mocked(authenticatedPatch).mockResolvedValue(ok(null))

    await adminService.setStatus(9, 'ACTIVE')

    expect(authenticatedPatch).toHaveBeenCalledWith({ status: 'ACTIVE' }, 'admin/users/9')
  })

  it('reads update status from the instance', async () => {
    vi.mocked(authenticatedGet).mockResolvedValue(ok({ updateAvailable: true }))

    expect((await adminService.updateStatus()).updateAvailable).toBe(true)
    expect(authenticatedGet).toHaveBeenCalledWith('admin/update')
  })
})
