import type { UserProfile } from '../types'
import { mockDelay } from './client'

const storageKey = 'meridian.profile.preview'
const blankProfile: UserProfile = { fullName: '', email: '', phone: '', timezone: 'Asia/Kolkata' }

function readProfile(): UserProfile {
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? 'null')
    if (saved && typeof saved.fullName === 'string' && typeof saved.email === 'string' && typeof saved.phone === 'string' && typeof saved.timezone === 'string') return saved
  } catch { /* Browser storage may be unavailable. */ }
  return blankProfile
}

export const profileApi = {
  get: (): Promise<UserProfile> => mockDelay(readProfile()),
  update: async (profile: UserProfile): Promise<UserProfile> => {
    window.localStorage.setItem(storageKey, JSON.stringify(profile))
    return mockDelay(profile)
  },
}
