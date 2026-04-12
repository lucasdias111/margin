import type { CreateMargin, Margin, MarginMember, UpdateMargin } from '$src/interfaces/Margin'
import {
  authenticatedGet,
  authenticatedPost,
  authenticatedPostForm,
  authenticatedDelete
} from '$src/services/api'
import { chatState } from '$src/states/ChatState.svelte'

class MarginService {
  async getMargin(marginId: number): Promise<Margin> {
    const response = await authenticatedGet(`margins/get_margin/${marginId}`)
    return response.json()
  }

  async updateMargin(margin: UpdateMargin): Promise<Margin> {
    const formData = new FormData()
    formData.append(
      'data',
      new Blob(
        [
          JSON.stringify({
            marginName: margin.marginName,
            description: margin.description,
            marginId: margin.marginId
          })
        ],
        { type: 'application/json' }
      )
    )
    if (margin.marginIcon) {
      formData.append('marginIcon', margin.marginIcon)
    }

    const response = await authenticatedPostForm(formData, 'margins/update_margin')
    return response.json()
  }

  async deleteMargin(marginId: number): Promise<void> {
    await authenticatedDelete(marginId, 'margins/delete_margin')
  }

  async updateMarginMemberRole(marginId: number, member: MarginMember): Promise<MarginMember> {
    const response = await authenticatedPost({ marginId, member }, 'margins/update_member_role')
    return response.json()
  }

  async removeMarginMember(marginId: number, userIdToRemove: number): Promise<void> {
    await authenticatedPost({ marginId, userIdToRemove }, 'margins/remove_margin_member')
  }

  async getMargins(): Promise<Margin[]> {
    const response = await authenticatedGet('margins/get_margins')
    return response.json()
  }

  async createMargin(margin: CreateMargin): Promise<Margin> {
    const formData = new FormData()!
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
    if (margin.marginIcon) {
      formData.append('marginIcon', margin.marginIcon)
    }

    const response = await authenticatedPostForm(formData, 'margins/create_new_margin')
    return response.json()
  }

  addNewMargin(newMargin: Margin): void {
    chatState.margins = [...chatState.margins, newMargin]
  }

  async loadMarginsForUser(): Promise<void> {
    const margins = await this.getMargins()
    chatState.margins = margins
    if (margins.length === 0) {
      chatState.hasMargin = false
    } else {
      chatState.selectMargin(margins[0])
    }
  }
}

export const marginService = new MarginService()
