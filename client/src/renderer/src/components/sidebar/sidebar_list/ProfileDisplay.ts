import type { User } from '$src/interfaces/User'
import avatar from '$src/assets/pics/anonym-avatar.png'

export function getPicURL(user: User): string {
  if (user.imageUrl && user.imageUrl.trim() !== '') return user.imageUrl
  else return avatar
}
