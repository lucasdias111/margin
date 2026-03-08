import { authenticatedGet, authenticatedPost } from '$src/services/api'
import type { Announcement } from '$src/interfaces/Announcement'

class AnnouncementService {
  async getAnnouncements(marginId: number): Promise<Announcement[]> {
    const res = await authenticatedGet(`api/announcements/get/${marginId}`)
    return res.json()
  }

  async createAnnouncement(
    marginId: number,
    title: string,
    content: string
  ): Promise<Announcement> {
    const res = await authenticatedPost({ marginId, title, content }, 'api/announcements/create')
    return res.json()
  }

  async deleteAnnouncement(announcementId: number, marginId: number): Promise<void> {
    await authenticatedPost({ marginId, announcementId }, 'api/announcements/delete')
  }

  async updateAnnouncement(announcement: Announcement): Promise<Announcement> {
    const res = await authenticatedPost(announcement, 'api/announcements/edit')
    return res.json()
  }
}

export const announcementService = new AnnouncementService()
