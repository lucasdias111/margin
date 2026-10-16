import {
  authenticatedDelete,
  authenticatedGet,
  authenticatedPatch,
  authenticatedPost
} from '$src/services/api'
import type {
  AccountStatus,
  AccountSummary,
  InstanceSettings,
  InstanceSettingsUpdate,
  InviteCode,
  MarginOverview,
  UpdateStatus
} from '$src/interfaces/Admin'
import type { InstanceRole } from '$src/interfaces/User'
import { instanceService } from '$src/services/InstanceService'

// The instance admin API. Every call needs an instance admin; the server enforces it.
class AdminService {
  async settings(): Promise<InstanceSettings> {
    return (await authenticatedGet('admin/settings')).json()
  }

  async updateSettings(update: InstanceSettingsUpdate): Promise<InstanceSettings> {
    const settings: InstanceSettings = await (
      await authenticatedPatch(update, 'admin/settings')
    ).json()
    // Name and registration mode are part of the public instance info.
    await instanceService.reload()
    return settings
  }

  async updateStatus(): Promise<UpdateStatus> {
    return (await authenticatedGet('admin/update')).json()
  }

  async sendTestMail(): Promise<void> {
    await authenticatedPost(null, 'admin/mail/test')
  }

  async users(): Promise<AccountSummary[]> {
    return (await authenticatedGet('admin/users')).json()
  }

  /** Creates an account and returns the link its owner uses to set a password. */
  async createUser(displayName: string, email: string): Promise<string> {
    const created: { userId: number; setPasswordLink: string } = await (
      await authenticatedPost({ displayName, email }, 'admin/users')
    ).json()
    return created.setPasswordLink
  }

  async setRole(userId: number, role: InstanceRole): Promise<void> {
    await authenticatedPatch({ role }, `admin/users/${userId}`)
  }

  async setStatus(userId: number, status: AccountStatus): Promise<void> {
    await authenticatedPatch({ status }, `admin/users/${userId}`)
  }

  async deleteUser(userId: number): Promise<void> {
    await authenticatedDelete(null, `admin/users/${userId}`)
  }

  /** A one-time link that lets the user set a new password. */
  async resetLink(userId: number): Promise<string> {
    const { link }: { link: string } = await (
      await authenticatedPost(null, `admin/users/${userId}/reset-link`)
    ).json()
    return link
  }

  async inviteCodes(): Promise<InviteCode[]> {
    return (await authenticatedGet('admin/invite-codes')).json()
  }

  async createInviteCode(maxUses: number | null, expiresAt: string | null): Promise<InviteCode> {
    return (await authenticatedPost({ maxUses, expiresAt }, 'admin/invite-codes')).json()
  }

  async revokeInviteCode(id: number): Promise<void> {
    await authenticatedDelete(null, `admin/invite-codes/${id}`)
  }

  async margins(): Promise<MarginOverview[]> {
    return (await authenticatedGet('admin/margins')).json()
  }

  async deleteMargin(id: number): Promise<void> {
    await authenticatedDelete(null, `admin/margins/${id}`)
  }
}

export const adminService = new AdminService()
