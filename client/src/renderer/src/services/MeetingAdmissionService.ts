import { authenticatedGet, authenticatedPost } from '$src/services/api'
import type { MeetingParticipantInfo } from '$src/interfaces/Meetings'

class MeetingAdmissionService {
  async waiting(code: string): Promise<MeetingParticipantInfo[]> {
    const response = await authenticatedGet(`meetings/${code}/lobby`)
    if (!response.ok) return []
    return response.json()
  }

  async admit(code: string, participantId: number): Promise<boolean> {
    const response = await authenticatedPost({ participantId }, `meetings/${code}/admit`)
    return response.ok
  }

  async deny(code: string, participantId: number): Promise<boolean> {
    const response = await authenticatedPost({ participantId }, `meetings/${code}/deny`)
    return response.ok
  }

  async remove(code: string, participantId: number): Promise<boolean> {
    const response = await authenticatedPost({ participantId }, `meetings/${code}/remove`)
    return response.ok
  }
}

export const meetingAdmissionService = new MeetingAdmissionService()
