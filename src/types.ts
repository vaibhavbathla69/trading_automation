export type OptionType = 'CE' | 'PE'
export type SignalState = 'RECEIVED' | 'PARSED' | 'WAITING_FOR_ENTRY' | 'ENTRY_TRIGGERED' | 'ORDER_PENDING' | 'FILLED' | 'POSITION_OPEN' | 'PARTIALLY_EXITED' | 'STOP_LOSS_HIT' | 'TARGET_HIT' | 'EXITED' | 'REJECTED' | 'FAILED' | 'MANUAL_REVIEW' | 'SKIPPED' | 'EXPIRED'
export type SignalOutcome = 'WAITING' | 'EXECUTED' | 'SKIPPED' | 'REJECTED' | 'MANUAL_REVIEW' | 'EXPIRED'
export type ConnectionState = 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED'
export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'TRADE' | 'SYSTEM'
export type SystemMode = 'PAPER' | 'LIVE'

export interface TimelineEvent {
  id: string
  at: string
  title: string
  detail?: string
  level?: LogLevel
}

export interface Signal {
  id: string
  receivedAt: string
  source: string
  rawMessage: string
  underlying: string
  expiry: string
  strike: number
  optionType: OptionType
  action: 'BUY' | 'SELL'
  entryType: 'ABOVE' | 'BELOW' | 'AT'
  entryPrice: number
  stopLoss: number
  targetMin: number
  targetMax?: number
  status: SignalState
  outcome: SignalOutcome
  confidence: number
  ltp?: number
  broker: string
  rejectionReason?: string
  resultingAction: string
  timeline: TimelineEvent[]
}

export interface Order {
  id: string
  brokerOrderId: string
  signalId: string
  positionId?: string
  side: 'BUY' | 'SELL'
  type: 'MARKET' | 'LIMIT'
  quantity: number
  requestedPrice?: number
  fillPrice?: number
  status: 'PENDING' | 'FILLED' | 'REJECTED' | 'CANCELLED'
  submittedAt: string
  filledAt?: string
}

export interface Position {
  id: string
  signalId: string
  underlying: string
  expiry: string
  strike: number
  optionType: OptionType
  quantity: number
  lots: number
  averageEntry: number
  signalPrice: number
  ltp: number
  stopLoss: number
  targetMin: number
  targetMax?: number
  unrealizedPnL: number
  status: 'POSITION_OPEN' | 'PARTIALLY_EXITED'
  openedAt: string
  source: string
  brokerOrderId: string
  broker: string
  updates: { at: string; message: string }[]
  timeline: TimelineEvent[]
}

export interface Trade {
  id: string
  positionId: string
  signalId: string
  underlying: string
  strike: number
  optionType: OptionType
  expiry: string
  entryPrice: number
  exitPrice: number
  quantity: number
  realizedPnL: number
  exitReason: 'TARGET' | 'STOP_LOSS' | 'MANI_UPDATE' | 'SQUARE_OFF' | 'MANUAL'
  stopLoss: number
  targetMin: number
  openedAt: string
  closedAt: string
  source: string
  brokerOrderIds: string[]
}

export interface SystemStatus {
  mode: SystemMode
  tradingEnabled: boolean
  autoExecutionEnabled: boolean
  emergencyStopped: boolean
  broker: { name: string; state: ConnectionState; checkedAt: string }
  telegram: { name: string; state: ConnectionState; checkedAt: string }
  marketData: { name: string; state: ConnectionState; checkedAt: string }
  lastSignalAt?: string
  backendAvailable: boolean
  health: 'HEALTHY' | 'DEGRADED' | 'CRITICAL'
  sessionDate: string
}

export interface TradingSettings {
  tradingEnabled: boolean
  mode: SystemMode
  broker: string
  telegramSource: string
  sizingMethod: 'LOTS' | 'CAPITAL'
  fixedLots: number
  capitalPerTrade: number
  maxTradesPerDay: number
  maxSimultaneousPositions: number
  maxCapitalDeployed: number
  maxDailyLoss: number
  maxEntrySlippagePercent: number
  maxSignalAgeSeconds: number
  rejectDuplicateSignals: boolean
  maxEntryDistancePercent: number
  skipMovedPrice: boolean
  orderType: 'MARKET' | 'LIMIT'
  targetRule: 'EXIT_FIRST' | 'PARTIAL_FIRST' | 'HOLD_UPPER' | 'FOLLOW_UPDATES'
  forceSquareOff: boolean
  squareOffTime: string
  allowOvernight: boolean
}

export interface SystemLog {
  id: string
  at: string
  level: LogLevel
  message: string
  detail?: string
  signalId?: string
  positionId?: string
}

export type AdminAction = 'PAUSE_NEW_TRADES' | 'RESUME_NEW_TRADES' | 'DISABLE_AUTO_EXECUTION' | 'ENABLE_AUTO_EXECUTION' | 'CLOSE_ALL_POSITIONS' | 'EMERGENCY_STOP'

export interface AdminActionResponse {
  requestId: string
  accepted: boolean
  message: string
}

export type RealtimeEvent =
  | { type: 'signal.updated'; data: Signal }
  | { type: 'position.updated'; data: Position }
  | { type: 'order.updated'; data: Order }
  | { type: 'system.updated'; data: SystemStatus }
  | { type: 'log.created'; data: SystemLog }
