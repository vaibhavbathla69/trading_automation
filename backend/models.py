from typing import Literal, Optional

from pydantic import BaseModel

OptionType = Literal["CE", "PE"]
SignalState = Literal[
    "RECEIVED", "PARSED", "WAITING_FOR_ENTRY", "ENTRY_TRIGGERED", "ORDER_PENDING",
    "FILLED", "POSITION_OPEN", "PARTIALLY_EXITED", "STOP_LOSS_HIT", "TARGET_HIT",
    "EXITED", "REJECTED", "FAILED", "MANUAL_REVIEW", "SKIPPED", "EXPIRED",
]
SignalOutcome = Literal["WAITING", "EXECUTED", "SKIPPED", "REJECTED", "MANUAL_REVIEW", "EXPIRED"]
ConnectionState = Literal["CONNECTED", "DEGRADED", "DISCONNECTED"]
LogLevel = Literal["INFO", "WARNING", "ERROR", "TRADE", "SYSTEM"]
SystemMode = Literal["PAPER", "LIVE"]
AdminAction = Literal[
    "PAUSE_NEW_TRADES", "RESUME_NEW_TRADES", "DISABLE_AUTO_EXECUTION",
    "ENABLE_AUTO_EXECUTION", "CLOSE_ALL_POSITIONS", "EMERGENCY_STOP",
]


class TimelineEvent(BaseModel):
    id: str
    at: str
    title: str
    detail: Optional[str] = None
    level: Optional[LogLevel] = None


class Signal(BaseModel):
    id: str
    receivedAt: str
    source: str
    rawMessage: str
    underlying: str
    expiry: str
    strike: float
    optionType: OptionType
    action: Literal["BUY", "SELL"]
    entryType: Literal["ABOVE", "BELOW", "AT"]
    entryPrice: float
    stopLoss: float
    targetMin: float
    targetMax: Optional[float] = None
    status: SignalState
    outcome: SignalOutcome
    confidence: float
    ltp: Optional[float] = None
    broker: str
    rejectionReason: Optional[str] = None
    resultingAction: str
    timeline: list[TimelineEvent]


class Position(BaseModel):
    id: str
    signalId: str
    underlying: str
    expiry: str
    strike: float
    optionType: OptionType
    quantity: int
    lots: int
    averageEntry: float
    signalPrice: float
    ltp: float
    stopLoss: float
    targetMin: float
    targetMax: Optional[float] = None
    unrealizedPnL: float
    status: Literal["POSITION_OPEN", "PARTIALLY_EXITED"]
    openedAt: str
    source: str
    brokerOrderId: str
    broker: str
    updates: list[dict]
    timeline: list[TimelineEvent]


class Trade(BaseModel):
    id: str
    positionId: str
    signalId: str
    underlying: str
    strike: float
    optionType: OptionType
    expiry: str
    entryPrice: float
    exitPrice: float
    quantity: int
    realizedPnL: float
    exitReason: Literal["TARGET", "STOP_LOSS", "MANI_UPDATE", "SQUARE_OFF", "MANUAL"]
    stopLoss: float
    targetMin: float
    openedAt: str
    closedAt: str
    source: str
    brokerOrderIds: list[str]


class ConnectionInfo(BaseModel):
    name: str
    state: ConnectionState
    checkedAt: str


class SystemStatus(BaseModel):
    mode: SystemMode
    tradingEnabled: bool
    autoExecutionEnabled: bool
    emergencyStopped: bool
    broker: ConnectionInfo
    telegram: ConnectionInfo
    marketData: ConnectionInfo
    lastSignalAt: Optional[str] = None
    backendAvailable: bool
    health: Literal["HEALTHY", "DEGRADED", "CRITICAL"]
    sessionDate: str


class TradingSettings(BaseModel):
    tradingEnabled: bool
    mode: SystemMode
    broker: str
    telegramSource: str
    sizingMethod: Literal["LOTS", "CAPITAL"]
    fixedLots: int
    capitalPerTrade: float
    maxTradesPerDay: int
    maxSimultaneousPositions: int
    maxCapitalDeployed: float
    maxDailyLoss: float
    maxEntrySlippagePercent: float
    maxSignalAgeSeconds: int
    rejectDuplicateSignals: bool
    maxEntryDistancePercent: float
    skipMovedPrice: bool
    orderType: Literal["MARKET", "LIMIT"]
    targetRule: Literal["EXIT_FIRST", "PARTIAL_FIRST", "HOLD_UPPER", "FOLLOW_UPDATES"]
    forceSquareOff: bool
    squareOffTime: str
    allowOvernight: bool


class SystemLog(BaseModel):
    id: str
    at: str
    level: LogLevel
    message: str
    detail: Optional[str] = None
    signalId: Optional[str] = None
    positionId: Optional[str] = None


class AdminActionRequest(BaseModel):
    action: AdminAction


class AdminActionResponse(BaseModel):
    requestId: str
    accepted: bool
    message: str


class TradingSettingsPatch(BaseModel):
    """Same fields as TradingSettings, all optional — PUT /api/settings merges whatever is set."""
    tradingEnabled: Optional[bool] = None
    mode: Optional[SystemMode] = None
    broker: Optional[str] = None
    telegramSource: Optional[str] = None
    sizingMethod: Optional[Literal["LOTS", "CAPITAL"]] = None
    fixedLots: Optional[int] = None
    capitalPerTrade: Optional[float] = None
    maxTradesPerDay: Optional[int] = None
    maxSimultaneousPositions: Optional[int] = None
    maxCapitalDeployed: Optional[float] = None
    maxDailyLoss: Optional[float] = None
    maxEntrySlippagePercent: Optional[float] = None
    maxSignalAgeSeconds: Optional[int] = None
    rejectDuplicateSignals: Optional[bool] = None
    maxEntryDistancePercent: Optional[float] = None
    skipMovedPrice: Optional[bool] = None
    orderType: Optional[Literal["MARKET", "LIMIT"]] = None
    targetRule: Optional[Literal["EXIT_FIRST", "PARTIAL_FIRST", "HOLD_UPPER", "FOLLOW_UPDATES"]] = None
    forceSquareOff: Optional[bool] = None
    squareOffTime: Optional[str] = None
    allowOvernight: Optional[bool] = None
