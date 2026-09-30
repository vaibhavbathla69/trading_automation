import type { RealtimeEvent } from '../types'
import { mockStore } from './client'

// Backend adapter point: replace with a WebSocket or SSE subscription.
// This mock transport emits control changes only; it does not invent trades or prices.
export const realtimeApi = {
  subscribe: (listener: (event: RealtimeEvent) => void) => mockStore.subscribe(listener),
}
