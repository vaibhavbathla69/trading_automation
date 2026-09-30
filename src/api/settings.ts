import type { TradingSettings } from '../types'
import { mockDelay, mockStore } from './client'

export const settingsApi = {
  get: (): Promise<TradingSettings> => mockDelay(mockStore.getSettings()),
  update: async (settings: TradingSettings): Promise<TradingSettings> => {
    mockStore.setSettings(settings)
    return mockDelay(mockStore.getSettings())
  },
}
