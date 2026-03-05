import type { CreateMargin, Margin, MarginMember, UpdateMargin } from '$src/interfaces/Margin'
import { authenticatedGet, authenticatedPost, authenticatedPostForm } from '$src/services/api'

class MarginService {
  async getMargin(marginId: number): Promise<Margin> {
    const response = await authenticatedGet(`api/margins/get_margin/${marginId}`)
    if (!response.ok) throw new Error(`Failed to get margin: ${response.status}`)
    return response.json()
  }

  async updateMargin(margin: UpdateMargin): Promise<Margin> {
    const response = await authenticatedPost(margin, 'api/margins/update_margin')
    if (!response.ok) throw new Error(`Failed to update margin: ${response.status}`)
    return response.json()
  }

  async deleteMargin(marginId: number): Promise<void> {
    const response = await authenticatedPost(marginId, 'api/margins/delete_margin')
    if (!response.ok) throw new Error(`Failed to delete margin: ${response.status}`)
  }

  async addMarginMember(marginId: number, userId: number, role: string): Promise<MarginMember> {
    const response = await authenticatedPost(
      { marginId, userId, role },
      'api/margins/add_margin_member'
    )
    if (!response.ok) throw new Error(`Failed to add margin member: ${response.status}`)
    return response.json()
  }

  async updateMarginMemberRole(marginId: number, member: MarginMember): Promise<MarginMember> {
    const response = await authenticatedPost({ marginId, member }, 'api/margins/update_member_role')
    if (!response.ok) throw new Error(`Failed to update member role: ${response.status}`)
    return response.json()
  }

  async removeMarginMember(marginId: number): Promise<void> {
    const response = await authenticatedPost(marginId, 'api/margins/remove_margin_member')
    if (!response.ok) throw new Error(`Failed to remove margin member: ${response.status}`)
  }

  async getMargins(): Promise<Margin[]> {
    const response = await authenticatedGet(`api/margins/get_margins`)
    if (!response.ok) throw new Error(`Request failed with status: ${response.status}`)
    return response.json()
  }

  async createMargin(margin: CreateMargin): Promise<void> {
    const formData = new FormData()
    formData.append(
      'data',
      new Blob(
        [
          JSON.stringify({
            marginName: margin.marginName,
            marginDescription: margin.marginDescription,
            visibility: margin.visibility ?? 'PUBLIC'
          })
        ],
        { type: 'application/json' }
      )
    )

    const response = await authenticatedPostForm(formData, 'api/margins/create_new_margin')
    if (!response.ok) throw new Error(`Failed to create margin: ${response.status}`)
  }
}

export const marginService = new MarginService()
