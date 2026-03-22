import type { CreateMargin, Margin, MarginMember, UpdateMargin } from '$src/interfaces/Margin'
import { authenticatedGet, authenticatedPost, authenticatedPostForm } from '$src/services/api'
import { errorService } from '$src/services/ErrorService'
import { chatState } from '$src/states/ChatState.svelte'

class MarginService {
  async getMargin(marginId: number): Promise<Margin> {
    const response = await authenticatedGet(`margins/get_margin/${marginId}`)
    if (!response.ok) throw new Error(`Failed to get margin: ${response.status}`)
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
        {
          type: 'application/json'
        }
      )
    )
    if (margin.marginIcon) {
      formData.append('marginIcon', margin.marginIcon)
    }

    const response = await authenticatedPostForm(formData, 'margins/update_margin')
    if (!response.ok) throw new Error(`Failed to update margin: ${response.status}`)
    return response.json()
  }

  async deleteMargin(marginId: number): Promise<void> {
    const response = await authenticatedPost(marginId, 'margins/delete_margin')
    if (!response.ok) errorService.reportError('Failed to delete margin ' + response.status)
  }

  async addMarginMember(marginId: number, userId: number, role: string): Promise<MarginMember> {
    const response = await authenticatedPost(
      { marginId, userId, role },
      'margins/add_margin_member'
    )
    if (!response.ok) errorService.reportError('Failed to add margin member ' + response.status)
    return response.json()
  }

  async updateMarginMemberRole(marginId: number, member: MarginMember): Promise<MarginMember> {
    const response = await authenticatedPost({ marginId, member }, 'margins/update_member_role')
    if (!response.ok) errorService.reportError('Failed to update member role: ' + response.status)
    return response.json()
  }

  async removeMarginMember(marginId: number): Promise<void> {
    const response = await authenticatedPost(marginId, 'margins/remove_margin_member')
    if (!response.ok) errorService.reportError('Failed to remove margin member: ' + response.status)
  }

  async getMargins(): Promise<Margin[]> {
    const response = await authenticatedGet(`margins/get_margins`)
    if (!response.ok) errorService.reportError('Failed to get margins: ' + response.status)
    return response.json()
  }

  async createMargin(margin: CreateMargin, marginIcon?: File | null): Promise<Margin> {
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

    if (marginIcon) {
      formData.append('marginIcon', marginIcon)
    }

    const response = await authenticatedPostForm(formData, 'margins/create_new_margin')
    if (!response.ok) errorService.reportError('Failed to create margin: ' + response.status)
    return response.json()
  }

  addNewMargin(newMargin: Margin): void {
    chatState.margins = [...chatState.margins, newMargin]
  }

  async loadMarginsForUser(): Promise<void> {
    marginService.getMargins().then((margins) => {
      chatState.margins = margins
      if (margins.length === 0) {
        chatState.hasMargin = false
      } else {
        chatState.selectMargin(margins[0])
      }
    })
  }
}

export const marginService = new MarginService()
