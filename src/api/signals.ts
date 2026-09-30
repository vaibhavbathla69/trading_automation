import type { Signal } from '../types'
import { mockDelay } from './client'
import { mockSignals } from './mockData'

export const signalsApi = {
  list: (): Promise<Signal[]> => mockDelay(mockSignals),
  get: (id: string): Promise<Signal | undefined> => mockDelay(mockSignals.find(signal => signal.id === id)),
}
