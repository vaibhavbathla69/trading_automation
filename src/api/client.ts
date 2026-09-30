import type { AdminAction, AdminActionResponse, RealtimeEvent, SystemStatus, TradingSettings } from '../types'
import { mockSettings, mockSystemStatus } from './mockData'

// Replace this module with HTTP calls when the backend is ready. All views use
// the domain APIs below and never import mock records directly.
export const mockDelay = async <T,>(value: T): Promise<T> => {
  await new Promise(resolve => setTimeout(resolve, 90))
  return structuredClone(value)
}

const settingsStorageKey = 'meridian.trading-rules.preview'
function initialSettings(): TradingSettings {
  try {
    const saved = JSON.parse(window.localStorage.getItem(settingsStorageKey) ?? 'null')
    if (saved && typeof saved === 'object') return { ...structuredClone(mockSettings), ...saved }
  } catch { /* Fall back to sample settings. */ }
  return structuredClone(mockSettings)
}

let currentSettings: TradingSettings = initialSettings()
let currentStatus: SystemStatus = structuredClone(mockSystemStatus)
const listeners = new Set<(event: RealtimeEvent) => void>()

export const mockStore = {
  getSettings: () => currentSettings,
  setSettings: (settings: TradingSettings) => {
    window.localStorage.setItem(settingsStorageKey, JSON.stringify(settings))
    currentSettings = structuredClone(settings)
    mockStore.setStatus({ ...currentStatus, mode: settings.mode, tradingEnabled: settings.tradingEnabled && !currentStatus.emergencyStopped })
  },
  getStatus: () => currentStatus,
  setStatus: (status: SystemStatus) => {
    currentStatus = structuredClone(status)
    listeners.forEach(listener => listener({ type: 'system.updated', data: structuredClone(status) }))
  },
  subscribe: (listener: (event: RealtimeEvent) => void) => {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  },
}

export async function mockAdminAction(action: AdminAction): Promise<AdminActionResponse> {
  if (currentStatus.emergencyStopped && (action === 'RESUME_NEW_TRADES' || action === 'ENABLE_AUTO_EXECUTION')) {
    return mockDelay({ requestId: `mock_req_${Date.now()}`, accepted: false, message: 'Emergency stop is active. Reset requires a backend operator workflow.' })
  }
  const next = structuredClone(currentStatus)
  if (action === 'PAUSE_NEW_TRADES') next.tradingEnabled = false
  if (action === 'RESUME_NEW_TRADES') next.tradingEnabled = true
  if (action === 'DISABLE_AUTO_EXECUTION') next.autoExecutionEnabled = false
  if (action === 'ENABLE_AUTO_EXECUTION') next.autoExecutionEnabled = true
  if (action === 'EMERGENCY_STOP') {
    next.tradingEnabled = false
    next.autoExecutionEnabled = false
    next.emergencyStopped = true
  }
  if (action !== 'CLOSE_ALL_POSITIONS') mockStore.setStatus(next)
  return mockDelay({
    requestId: `mock_req_${Date.now()}`,
    accepted: true,
    message: action === 'CLOSE_ALL_POSITIONS'
      ? 'Mock close-all request recorded. No positions were changed.'
      : 'Mock control request recorded. No broker action was sent.',
  })
}
