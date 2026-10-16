import type { RegistrationMode } from '$src/interfaces/Instance'
import type { InstanceRole } from '$src/interfaces/User'

export type MarginCreationPolicy = 'EVERYONE' | 'ADMINS_ONLY'
export type AccountStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'DISABLED'

export interface InstanceSettings {
  instanceName: string
  registrationMode: RegistrationMode
  marginCreationPolicy: MarginCreationPolicy
  requireEmailVerification: boolean
  requireAccountApproval: boolean
  // 0 means unlimited.
  maxCallParticipants: number
  mailEnabled: boolean
}

export type InstanceSettingsUpdate = Partial<Omit<InstanceSettings, 'mailEnabled'>>

export interface AccountSummary {
  id: number
  displayName: string
  email: string
  role: InstanceRole
  status: AccountStatus
  createdAt: string
  lastSeenAt: string | null
}

export interface InviteCode {
  id: number
  code: string
  maxUses: number | null
  useCount: number
  expiresAt: string | null
  revoked: boolean
  usable: boolean
  createdAt: string
}

export interface MarginOverview {
  id: number
  name: string
  owner: { id: number; displayName: string; email: string } | null
  memberCount: number
  storageBytes: number
  createdAt: string
}

export interface UpdateStatus {
  enabled: boolean
  currentVersion: string
  latestVersion: string | null
  updateAvailable: boolean
  releaseUrl: string | null
  checkedAt: string | null
}
