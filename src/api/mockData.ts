import type { Position, Signal, SystemLog, SystemStatus, Trade, TradingSettings } from '../types'

const event = (id: string, at: string, title: string, detail?: string) => ({ id, at, title, detail })

export const mockSignals: Signal[] = [
  {
    id: 'sig_001', receivedAt: '2026-09-30T10:15:22+05:30', source: 'Mani Telegram',
    rawMessage: 'BUY HINDALCO OCT 960 PE ABOVE 26.8\nSL 22\nTARGET 28.5 ..... 40',
    underlying: 'HINDALCO', expiry: '2026-10-29', strike: 960, optionType: 'PE', action: 'BUY', entryType: 'ABOVE',
    entryPrice: 26.8, stopLoss: 22, targetMin: 28.5, targetMax: 40, status: 'POSITION_OPEN', outcome: 'EXECUTED',
    confidence: 0.99, ltp: 31.45, broker: 'Angel One', resultingAction: 'Position opened · 300 qty',
    timeline: [
      event('e1', '2026-09-30T10:15:22+05:30', 'Signal received', 'Mani Telegram'),
      event('e2', '2026-09-30T10:15:22+05:30', 'Parsed successfully', 'HINDALCO OCT 960 PE'),
      event('e3', '2026-09-30T10:16:42+05:30', 'Entry triggered', 'LTP crossed ₹26.80'),
      event('e4', '2026-09-30T10:16:42+05:30', 'Order submitted', 'Angel One · MARKET'),
      event('e5', '2026-09-30T10:16:43+05:30', 'Order filled', '300 @ ₹26.85'),
      event('e6', '2026-09-30T10:24:10+05:30', 'Mani update received', 'Hold for upper target'),
    ],
  },
  {
    id: 'sig_002', receivedAt: '2026-09-30T11:42:08+05:30', source: 'Mani Telegram',
    rawMessage: 'BUY NIFTY OCT 25800 CE ABOVE 112\nSL 98 TARGET 125 ..... 148',
    underlying: 'NIFTY', expiry: '2026-10-01', strike: 25800, optionType: 'CE', action: 'BUY', entryType: 'ABOVE',
    entryPrice: 112, stopLoss: 98, targetMin: 125, targetMax: 148, status: 'WAITING_FOR_ENTRY', outcome: 'WAITING',
    confidence: 0.98, ltp: 108.4, broker: 'Angel One', resultingAction: 'Monitoring entry',
    timeline: [event('e7', '2026-09-30T11:42:08+05:30', 'Signal received'), event('e8', '2026-09-30T11:42:09+05:30', 'Parsed successfully'), event('e9', '2026-09-30T11:42:09+05:30', 'Waiting for entry', 'Trigger ₹112.00')],
  },
  {
    id: 'sig_003', receivedAt: '2026-09-30T12:18:35+05:30', source: 'Mani Telegram',
    rawMessage: 'BUY RELIANCE OCT 1460 CE ABOVE 41\nSL 35 TARGET 48 ..... 58',
    underlying: 'RELIANCE', expiry: '2026-10-29', strike: 1460, optionType: 'CE', action: 'BUY', entryType: 'ABOVE',
    entryPrice: 41, stopLoss: 35, targetMin: 48, targetMax: 58, status: 'POSITION_OPEN', outcome: 'EXECUTED',
    confidence: 0.97, ltp: 39.6, broker: 'Angel One', resultingAction: 'Position opened · 250 qty',
    timeline: [event('e10', '2026-09-30T12:18:35+05:30', 'Signal received'), event('e11', '2026-09-30T12:18:36+05:30', 'Parsed successfully'), event('e12', '2026-09-30T12:21:14+05:30', 'Entry triggered'), event('e13', '2026-09-30T12:21:14+05:30', 'Order submitted'), event('e14', '2026-09-30T12:21:15+05:30', 'Order filled', '250 @ ₹41.20')],
  },
  {
    id: 'sig_004', receivedAt: '2026-09-30T12:46:11+05:30', source: 'Mani Telegram',
    rawMessage: 'BUY BANKNIFTY OCT 59200 PE ABOVE 185\nSL 165 TARGET 210 ..... 235',
    underlying: 'BANKNIFTY', expiry: '2026-10-01', strike: 59200, optionType: 'PE', action: 'BUY', entryType: 'ABOVE',
    entryPrice: 185, stopLoss: 165, targetMin: 210, targetMax: 235, status: 'WAITING_FOR_ENTRY', outcome: 'WAITING',
    confidence: 0.96, ltp: 178.5, broker: 'Angel One', resultingAction: 'Monitoring entry',
    timeline: [event('e15', '2026-09-30T12:46:11+05:30', 'Signal received'), event('e16', '2026-09-30T12:46:12+05:30', 'Parsed successfully'), event('e17', '2026-09-30T12:46:12+05:30', 'Waiting for entry', 'Trigger ₹185.00')],
  },
  {
    id: 'sig_005', receivedAt: '2026-09-30T13:07:44+05:30', source: 'Mani Telegram',
    rawMessage: 'BUY TATASTEEL OCT 170 CE ABOVE 13.5\nSL 11 TARGET 16 ..... 19',
    underlying: 'TATASTEEL', expiry: '2026-10-29', strike: 170, optionType: 'CE', action: 'BUY', entryType: 'ABOVE',
    entryPrice: 13.5, stopLoss: 11, targetMin: 16, targetMax: 19, status: 'TARGET_HIT', outcome: 'EXECUTED',
    confidence: 0.99, ltp: 16.2, broker: 'Angel One', resultingAction: 'Closed · Target hit',
    timeline: [event('e18', '2026-09-30T13:07:44+05:30', 'Signal received'), event('e19', '2026-09-30T13:07:45+05:30', 'Parsed successfully'), event('e20', '2026-09-30T13:10:02+05:30', 'Order filled', '550 @ ₹13.55'), event('e21', '2026-09-30T13:42:51+05:30', 'Target hit', 'Exited @ ₹16.00')],
  },
  {
    id: 'sig_006', receivedAt: '2026-09-30T13:26:19+05:30', source: 'Mani Telegram',
    rawMessage: 'BUY INFY OCT 1510 CE ABOVE 32 SL 27 TARGET 38',
    underlying: 'INFY', expiry: '2026-10-29', strike: 1510, optionType: 'CE', action: 'BUY', entryType: 'ABOVE',
    entryPrice: 32, stopLoss: 27, targetMin: 38, status: 'REJECTED', outcome: 'REJECTED',
    confidence: 0.93, ltp: 38.9, broker: 'Angel One', rejectionReason: 'Price moved 21.6% beyond the signal entry. Maximum allowed: 2%.', resultingAction: 'Rejected · Price moved too far',
    timeline: [event('e22', '2026-09-30T13:26:19+05:30', 'Signal received'), event('e23', '2026-09-30T13:26:20+05:30', 'Parsed successfully'), event('e24', '2026-09-30T13:26:20+05:30', 'Rejected by entry rule', 'Price moved beyond configured limit')],
  },
  {
    id: 'sig_007', receivedAt: '2026-09-30T13:51:03+05:30', source: 'Mani Telegram',
    rawMessage: 'BUY SBIN OCT 900 PE ABOVE 18\nSL? TARGET 22 ..... 27',
    underlying: 'SBIN', expiry: '2026-10-29', strike: 900, optionType: 'PE', action: 'BUY', entryType: 'ABOVE',
    entryPrice: 18, stopLoss: 0, targetMin: 22, targetMax: 27, status: 'MANUAL_REVIEW', outcome: 'MANUAL_REVIEW',
    confidence: 0.61, ltp: 17.7, broker: 'Angel One', rejectionReason: 'Stop loss was missing or ambiguous in the source message.', resultingAction: 'Held for manual review',
    timeline: [event('e25', '2026-09-30T13:51:03+05:30', 'Signal received'), event('e26', '2026-09-30T13:51:04+05:30', 'Manual review required', 'Ambiguous stop loss')],
  },
]

export const mockPositions: Position[] = [
  {
    id: 'pos_001', signalId: 'sig_001', underlying: 'HINDALCO', expiry: '2026-10-29', strike: 960, optionType: 'PE',
    quantity: 300, lots: 2, averageEntry: 26.85, signalPrice: 26.8, ltp: 31.45, stopLoss: 22, targetMin: 28.5, targetMax: 40,
    unrealizedPnL: 1380, status: 'POSITION_OPEN', openedAt: '2026-09-30T10:16:43+05:30', source: 'Mani Telegram',
    brokerOrderId: 'AO-260930-10482', broker: 'Angel One',
    updates: [{ at: '2026-09-30T10:24:10+05:30', message: 'Hold for upper target.' }],
    timeline: mockSignals[0].timeline,
  },
  {
    id: 'pos_002', signalId: 'sig_003', underlying: 'RELIANCE', expiry: '2026-10-29', strike: 1460, optionType: 'CE',
    quantity: 250, lots: 1, averageEntry: 41.2, signalPrice: 41, ltp: 39.6, stopLoss: 35, targetMin: 48, targetMax: 58,
    unrealizedPnL: -400, status: 'POSITION_OPEN', openedAt: '2026-09-30T12:21:15+05:30', source: 'Mani Telegram',
    brokerOrderId: 'AO-260930-11739', broker: 'Angel One', updates: [], timeline: mockSignals[2].timeline,
  },
]

export const mockTrades: Trade[] = [
  { id: 'trd_001', positionId: 'pos_003', signalId: 'sig_005', underlying: 'TATASTEEL', strike: 170, optionType: 'CE', expiry: '2026-10-29', entryPrice: 13.55, exitPrice: 16, quantity: 550, realizedPnL: 1347.5, exitReason: 'TARGET', stopLoss: 11, targetMin: 16, openedAt: '2026-09-30T13:10:02+05:30', closedAt: '2026-09-30T13:42:51+05:30', source: 'Mani Telegram', brokerOrderIds: ['AO-260930-12111', 'AO-260930-12284'] },
  { id: 'trd_002', positionId: 'pos_004', signalId: 'sig_prev_002', underlying: 'NIFTY', strike: 25750, optionType: 'PE', expiry: '2026-09-30', entryPrice: 92.4, exitPrice: 86.7, quantity: 150, realizedPnL: -855, exitReason: 'STOP_LOSS', stopLoss: 87, targetMin: 108, openedAt: '2026-09-30T09:44:16+05:30', closedAt: '2026-09-30T10:08:32+05:30', source: 'Mani Telegram', brokerOrderIds: ['AO-260930-10019', 'AO-260930-10144'] },
  { id: 'trd_003', positionId: 'pos_005', signalId: 'sig_prev_003', underlying: 'HDFCBANK', strike: 1820, optionType: 'CE', expiry: '2026-10-29', entryPrice: 34.1, exitPrice: 40.5, quantity: 250, realizedPnL: 1600, exitReason: 'TARGET', stopLoss: 29, targetMin: 40, openedAt: '2026-09-29T11:04:02+05:30', closedAt: '2026-09-29T11:57:24+05:30', source: 'Mani Telegram', brokerOrderIds: ['AO-260929-10493', 'AO-260929-10886'] },
]

export const mockLogs: SystemLog[] = [
  { id: 'log_001', at: '2026-09-30T13:51:04+05:30', level: 'WARNING', message: 'Signal requires manual review', detail: 'SBIN stop loss is ambiguous. No order submitted.', signalId: 'sig_007' },
  { id: 'log_002', at: '2026-09-30T13:42:51+05:30', level: 'TRADE', message: 'Position closed at first target', detail: 'TATASTEEL 170 CE · P&L +₹1,347.50', signalId: 'sig_005' },
  { id: 'log_003', at: '2026-09-30T13:26:20+05:30', level: 'WARNING', message: 'Signal rejected by entry rule', detail: 'INFY price moved beyond configured 2% limit.', signalId: 'sig_006' },
  { id: 'log_004', at: '2026-09-30T12:46:12+05:30', level: 'INFO', message: 'Waiting for entry condition', detail: 'BANKNIFTY 59200 PE · trigger ₹185.00', signalId: 'sig_004' },
  { id: 'log_005', at: '2026-09-30T12:21:15+05:30', level: 'TRADE', message: 'Order filled', detail: 'RELIANCE 1460 CE · 250 @ ₹41.20', signalId: 'sig_003', positionId: 'pos_002' },
  { id: 'log_006', at: '2026-09-30T11:42:09+05:30', level: 'INFO', message: 'Contract resolved', detail: 'NIFTY OCT 25800 CE', signalId: 'sig_002' },
  { id: 'log_007', at: '2026-09-30T10:24:10+05:30', level: 'INFO', message: 'Mani update received', detail: 'Hold for upper target.', signalId: 'sig_001', positionId: 'pos_001' },
  { id: 'log_008', at: '2026-09-30T10:16:43+05:30', level: 'TRADE', message: 'Order filled', detail: 'HINDALCO 960 PE · 300 @ ₹26.85', signalId: 'sig_001', positionId: 'pos_001' },
  { id: 'log_009', at: '2026-09-30T09:15:00+05:30', level: 'SYSTEM', message: 'Connections healthy', detail: 'Broker, Telegram, and market data connected.' },
]

export const mockSystemStatus: SystemStatus = {
  mode: 'PAPER', tradingEnabled: true, autoExecutionEnabled: true, emergencyStopped: false,
  broker: { name: 'Angel One', state: 'CONNECTED', checkedAt: '2026-09-30T13:51:04+05:30' },
  telegram: { name: 'Mani Telegram', state: 'CONNECTED', checkedAt: '2026-09-30T13:51:04+05:30' },
  marketData: { name: 'Market feed', state: 'CONNECTED', checkedAt: '2026-09-30T13:51:04+05:30' },
  lastSignalAt: '2026-09-30T13:51:03+05:30', backendAvailable: true, health: 'HEALTHY', sessionDate: '2026-09-30',
}

export const mockSettings: TradingSettings = {
  tradingEnabled: true, mode: 'PAPER', broker: 'Angel One', telegramSource: 'Mani Telegram',
  sizingMethod: 'LOTS', fixedLots: 2, capitalPerTrade: 15000, maxTradesPerDay: 8,
  maxSimultaneousPositions: 3, maxCapitalDeployed: 75000, maxDailyLoss: 5000,
  maxEntrySlippagePercent: 1, maxSignalAgeSeconds: 90, rejectDuplicateSignals: true,
  maxEntryDistancePercent: 2, skipMovedPrice: true, orderType: 'MARKET', targetRule: 'PARTIAL_FIRST',
  forceSquareOff: true, squareOffTime: '15:15', allowOvernight: false,
}
