import { beforeEach, describe, expect, it, vi } from 'vitest'
import { spaceService } from '../SpaceService'
import { authenticatedGet } from '$src/services/api'
import { spaceState } from '$src/states/SpaceState.svelte'
import { usersState } from '$src/states/UsersState.svelte'
import { conversationsState } from '$src/states/ConversationsState.svelte'
import { buildChannel, buildSpace, buildUser } from '$src/test-utils/mocks'

vi.mock('$src/services/api', () => ({
  authenticatedGet: vi.fn(),
  authenticatedPost: vi.fn(),
  authenticatedDelete: vi.fn()
}))

const get = vi.mocked(authenticatedGet)

function jsonResponse(body: unknown): Response {
  return { ok: true, json: async () => body } as Response
}

describe('SpaceService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    spaceState.setSpaces([])
    usersState.reset()
    conversationsState.clear()
  })

  describe('getAllSpacesForUser', () => {
    // Regression: the sidebar used to fan out one sfu/voice_participants request
    // per channel on top of this call, so a margin with 22 channels cost 23
    // requests (46 with CORS preflights) every time the space list changed.
    it('loads every space and its voice participants in a single request', async () => {
      const spaces = [
        buildSpace({
          spaceId: 1,
          channels: [
            buildChannel({
              id: 10,
              conversationId: 100,
              voiceParticipants: [buildUser({ id: 7 })]
            }),
            buildChannel({ id: 11, conversationId: 101, voiceParticipants: [] })
          ]
        }),
        buildSpace({
          spaceId: 2,
          channels: [buildChannel({ id: 20, conversationId: 200, voiceParticipants: [] })]
        })
      ]
      get.mockResolvedValue(jsonResponse(spaces))

      await spaceService.getAllSpacesForUser(1)

      expect(get).toHaveBeenCalledTimes(1)
      expect(get).toHaveBeenCalledWith('spaces/get_all_spaces_for_user/1')
    })

    it('never calls the per-channel voice participants endpoint', async () => {
      get.mockResolvedValue(
        jsonResponse([
          buildSpace({
            spaceId: 1,
            channels: [buildChannel({ id: 10 }), buildChannel({ id: 11 })]
          })
        ])
      )

      await spaceService.getAllSpacesForUser(1)

      const requested = get.mock.calls.map(([url]) => url)
      expect(requested.some((url) => url.includes('voice_participants'))).toBe(false)
    })

    it('exposes voice participants from the spaces payload', async () => {
      get.mockResolvedValue(
        jsonResponse([
          buildSpace({
            spaceId: 1,
            channels: [buildChannel({ id: 10, voiceParticipants: [buildUser({ id: 7 })] })]
          })
        ])
      )

      await spaceService.getAllSpacesForUser(1)

      expect(spaceState.spaces[0].channels[0].voiceParticipants).toEqual([
        expect.objectContaining({ id: 7 })
      ])
    })

    it('hydrates voice participants into the user store', async () => {
      get.mockResolvedValue(
        jsonResponse([
          buildSpace({
            spaceId: 1,
            members: [],
            channels: [
              buildChannel({
                id: 10,
                voiceParticipants: [buildUser({ id: 7, displayName: 'Nadia' })]
              })
            ]
          })
        ])
      )

      await spaceService.getAllSpacesForUser(1)

      expect(usersState.byId.get(7)?.displayName).toBe('Nadia')
    })

    it('indexes each channel conversation against the margin', async () => {
      get.mockResolvedValue(
        jsonResponse([
          buildSpace({ spaceId: 1, channels: [buildChannel({ id: 10, conversationId: 100 })] })
        ])
      )

      await spaceService.getAllSpacesForUser(3)

      expect(conversationsState.marginIdByConversationId.get(100)).toBe(3)
    })
  })
})
