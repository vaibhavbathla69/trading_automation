import type { Position } from '../types'
import { mockDelay } from './client'
import { mockPositions } from './mockData'

export const positionsApi = {
  list: (): Promise<Position[]> => mockDelay(mockPositions),
  get: (id: string): Promise<Position | undefined> => mockDelay(mockPositions.find(position => position.id === id)),
}
