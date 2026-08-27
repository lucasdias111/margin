import { authenticatedGet, authenticatedPost } from '$src/services/api'
import type { EligibleMargin, Meeting, MeetingJoinInfo } from '$src/interfaces/Meetings'

class MeetingService {
  async loadEligibleMargins(): Promise<EligibleMargin[]> {
    const response = await authenticatedGet('meetings/eligible-margins')
    if (!response.ok) return []
    return response.json()
  }

  async createMeeting(marginId: number, title: string | null): Promise<Meeting | null> {
    const response = await authenticatedPost({ marginId, title }, 'meetings')
    if (!response.ok) return null
    return response.json()
  }

  async getMeeting(code: string): Promise<Meeting | null> {
    const response = await authenticatedGet(`meetings/${code}`)
    if (!response.ok) return null
    return response.json()
  }

  async join(code: string): Promise<MeetingJoinInfo | null> {
    const response = await authenticatedPost(null, `meetings/${code}/join`)
    if (!response.ok) return null
    return response.json()
  }

  async end(code: string): Promise<void> {
    await authenticatedPost(null, `meetings/${code}/end`)
  }

  shareLink(code: string): string {
    return `${window.location.origin}${import.meta.env.BASE_URL}#/meet/${code}`
  }
}

export const meetingService = new MeetingService()
