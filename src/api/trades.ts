import type { Trade } from '../types'
import { mockDelay } from './client'
import { mockTrades } from './mockData'

export const tradesApi = {
  list: (): Promise<Trade[]> => mockDelay(mockTrades),
  get: (id: string): Promise<Trade | undefined> => mockDelay(mockTrades.find(trade => trade.id === id)),
}
