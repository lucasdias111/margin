import { authenticatedGet, authenticatedPost } from '$src/services/api'

export interface MarginInviteDetails {
  id: number
  marginName: string
  invitedByUser: string
  expiresAt: string
  inviteCode: string
}

export interface PendingInvite {
  id: number
  marginName: string
  invitedByUser: string
  createdAt: string
  inviteCode: string
}

/** Accepts a bare invite code or a pasted invite link (https://<instance>/invite/<code>). */
export function inviteCodeFrom(input: string): string {
  const trimmed = input.trim()
  const match = trimmed.match(/\/invite\/([^/?#\s]+)/)
  return match ? decodeURIComponent(match[1]) : trimmed
}

class MarginInviteService {
  async createLinkInvite(marginId: number, maxUses?: number): Promise<{ inviteCode: string }> {
    const params = maxUses ? `?maxUses=${maxUses}` : ''
    const response = await authenticatedPost(null, `invites/margins/${marginId}/link${params}`)
    return response.json()
  }

  async sendDirectInvite(marginId: number, email: string): Promise<void> {
    await authenticatedPost(
      null,
      `invites/margins/${marginId}/email?email=${encodeURIComponent(email)}`
    )
  }

  async getInviteDetails(code: string): Promise<MarginInviteDetails> {
    const response = await authenticatedGet(`invites/join/${code}`)
    return response.json()
  }

  async acceptLinkInvite(code: string): Promise<any> {
    const response = await authenticatedPost(null, `invites/join/${code}`)
    if (!response.ok) throw new Error(`Invite failed: ${response.status}`)
    return response.json()
  }

  async acceptDirectInvite(id: number): Promise<any> {
    const response = await authenticatedPost(null, `invites/${id}/accept`)
    return response.json()
  }

  async declineDirectInvite(id: number): Promise<void> {
    await authenticatedPost(null, `invites/${id}/decline`)
  }

  async getPendingInvites(): Promise<PendingInvite[]> {
    const response = await authenticatedGet('invites/pending')
    return response.json()
  }
}

export const marginInviteService = new MarginInviteService()
