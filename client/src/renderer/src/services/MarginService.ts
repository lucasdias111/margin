import type { CreateMargin, Margin, MarginMember, UpdateMargin } from '$src/interfaces/Margin'
import {
  authenticatedDelete,
  authenticatedGet,
  authenticatedPost,
  authenticatedPostForm
} from '$src/services/api'
import { spaceState } from '$src/states/SpaceState.svelte'
import { View } from '$src/interfaces/View'
import { navigationService } from '$src/services/NavigationService'
import { marginState } from '$src/states/MarginState.svelte'
import { navigationState } from '$src/states/NavigationState.svelte'

class MarginService {
  select(margin: Margin): void {
    navigationState.selectedMargin = margin
    marginState.setIsMemberOfAnyMargins(true)
    navigationState.selectedChannel = null
    spaceState.setSpaces([])
    navigationState.selectedSpace = null
  }
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

  async deleteMargin(margin: Margin): Promise<void> {
    await authenticatedDelete(margin.marginId, 'margins/delete_margin')

    marginState.margins = marginState.margins.filter((m) => m.marginId !== margin.marginId)

    if (marginState.margins.length > 0) {
      marginService.select(marginState.margins[0])
    } else {
      marginState.isMemberOfAnyMargins = false
    }
    navigationService.setView(View.Margin)
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
    const newMargin: Margin = await response.json()
    this.addNewMargin(newMargin)
    return newMargin
  }

  addNewMargin(newMargin: Margin): void {
    this.select(newMargin)
    if (marginState.margins.some((m) => m.marginId === newMargin.marginId)) return
    marginState.margins = [...marginState.margins, newMargin]
  }

  removeMargin(marginId: number): void {
    const remaining = marginState.margins.filter((margin) => margin.marginId !== marginId)
    marginState.margins = remaining
    if (navigationState.selectedMargin?.marginId === marginId) {
      if (remaining.length > 0) {
        this.select(remaining[0])
      } else {
        navigationState.selectedMargin = null
        marginState.isMemberOfAnyMargins = false
      }
    }
  }

  async loadMarginsForUser(): Promise<void> {
    const margins = await this.getMargins()
    marginState.margins = margins
    if (margins.length === 0) {
      marginState.isMemberOfAnyMargins = false
    } else {
      this.select(margins[0])
    }
  }

  updateMarginDetails(
    marginId: number,
    name: string,
    description: string,
    iconUrl: string | null
  ): void {
    const selectedMargin = navigationState.selectedMargin
    if (selectedMargin?.marginId === marginId) {
      selectedMargin.marginName = name
      selectedMargin.marginDescription = description
      selectedMargin.marginIconUrl = iconUrl
    }
    marginState.margins = marginState.margins.map((m) =>
      m.marginId === marginId
        ? { ...m, marginName: name, marginDescription: description, marginIconUrl: iconUrl }
        : m
    )
  }
}

export const marginService = new MarginService()
