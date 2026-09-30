import { createContext, useContext, useEffect, useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { Activity, BookOpenText, ChartNoAxesCombined, CircleStop, LayoutDashboard, ListFilter, Menu, Radio, Settings2, X } from 'lucide-react'
import type { AdminAction, Position, Signal, SystemLog, SystemStatus, Trade, TradingSettings } from './types'
import { signalsApi } from './api/signals'
import { positionsApi } from './api/positions'
import { tradesApi } from './api/trades'
import { settingsApi } from './api/settings'
import { systemApi } from './api/system'
import { realtimeApi } from './api/realtime'
import { date, timeSeconds } from './lib/format'
import { ConfirmationModal, EmptyState, ErrorState, LoadingState } from './components/ui'
import { SignalDrawer, PositionDrawer } from './components/drawers'
import { DashboardPage } from './pages/DashboardPage'
import { SignalsPage } from './pages/SignalsPage'
import { PositionsPage } from './pages/PositionsPage'
import { TradesPage } from './pages/TradesPage'
import { SettingsPage } from './pages/SettingsPage'
import { LogsPage } from './pages/LogsPage'
import './styles.css'
import './redesign.css'

interface AppData {
  signals: Signal[]
  positions: Position[]
  trades: Trade[]
  logs: SystemLog[]
  status: SystemStatus
  settings: TradingSettings
  setSettings: (settings: TradingSettings) => void
  requestAction: (action: AdminAction) => void
  openSignal: (signal: Signal) => void
  openPosition: (position: Position) => void
  notice: (message: string) => void
}

const DataContext = createContext<AppData | null>(null)
export function useAppData() {
  const value = useContext(DataContext)
  if (!value) throw new Error('App data unavailable')
  return value
}

const primaryNav = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/signals', label: 'Signals', icon: Radio },
  { to: '/positions', label: 'Positions', icon: ChartNoAxesCombined },
  { to: '/trades', label: 'History', icon: BookOpenText },
]
const secondaryNav = [
  { to: '/logs', label: 'System logs', icon: ListFilter },
  { to: '/settings', label: 'Trading rules', icon: Settings2 },
]
const titleByPath: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Trading desk', subtitle: 'Today’s positions, signals, and exceptions.' },
  '/signals': { title: 'Signals', subtitle: 'Incoming calls and what happened to them.' },
  '/positions': { title: 'Positions', subtitle: 'Open exposure and execution details.' },
  '/trades': { title: 'History', subtitle: 'Closed trades and their outcomes.' },
  '/logs': { title: 'System logs', subtitle: 'Operational events in time order.' },
  '/settings': { title: 'Trading rules', subtitle: 'Values enforced by the trading service.' },
}

function AppShell() {
  const [data, setData] = useState<Omit<AppData, 'setSettings' | 'requestAction' | 'openSignal' | 'openPosition' | 'notice'> | null>(null)
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [pendingAction, setPendingAction] = useState<AdminAction | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [clock, setClock] = useState(new Date())
  const [loadError, setLoadError] = useState(false)
  const location = useLocation()

  useEffect(() => {
    let active = true
    Promise.all([signalsApi.list(), positionsApi.list(), tradesApi.list(), systemApi.getLogs(), systemApi.getStatus(), settingsApi.get()])
      .then(([signals, positions, trades, logs, status, settings]) => {
        if (active) setData({ signals, positions, trades, logs, status, settings })
      })
      .catch(() => { if (active) setLoadError(true) })
    const unsubscribe = realtimeApi.subscribe(event => {
      if (event.type === 'system.updated') setData(prev => prev ? { ...prev, status: event.data } : prev)
      if (event.type === 'signal.updated') setData(prev => prev ? { ...prev, signals: prev.signals.map(item => item.id === event.data.id ? event.data : item) } : prev)
      if (event.type === 'position.updated') setData(prev => prev ? { ...prev, positions: prev.positions.map(item => item.id === event.data.id ? event.data : item) } : prev)
      if (event.type === 'log.created') setData(prev => prev ? { ...prev, logs: [event.data, ...prev.logs] } : prev)
    })
    const timer = window.setInterval(() => setClock(new Date()), 1000)
    return () => { active = false; unsubscribe(); window.clearInterval(timer) }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4400)
    return () => window.clearTimeout(timer)
  }, [toast])

  const page = titleByPath[location.pathname] ?? titleByPath['/']
  const actionLabels: Record<AdminAction, string> = {
    PAUSE_NEW_TRADES: 'Pause new trades', RESUME_NEW_TRADES: 'Resume new trades',
    DISABLE_AUTO_EXECUTION: 'Disable auto execution', ENABLE_AUTO_EXECUTION: 'Enable auto execution',
    CLOSE_ALL_POSITIONS: 'Close all positions', EMERGENCY_STOP: 'Emergency stop',
  }
  const actionDescriptions: Record<AdminAction, string> = {
    PAUSE_NEW_TRADES: 'The backend will stop accepting new entries. Existing positions remain under its management.',
    RESUME_NEW_TRADES: 'The backend will be asked to resume accepting new entries.',
    DISABLE_AUTO_EXECUTION: 'The backend will stop automatically submitting orders.',
    ENABLE_AUTO_EXECUTION: 'The backend will be asked to resume automatic order submission.',
    CLOSE_ALL_POSITIONS: 'The backend will be asked to exit every open position. This action can affect all current exposure.',
    EMERGENCY_STOP: 'The backend will be asked to stop new trading and automatic execution immediately.',
  }

  async function confirmAction() {
    if (!pendingAction) return
    const action = pendingAction
    setPendingAction(null)
    try {
      const result = await systemApi.requestAction(action)
      setToast(result.message)
    } catch {
      setToast('Control request failed. Check system status before retrying.')
    }
  }

  async function saveSettings(settings: TradingSettings) {
    try {
      const saved = await settingsApi.update(settings)
      setData(prev => prev ? { ...prev, settings: saved } : prev)
      setToast('Rules saved to the mock API.')
    } catch {
      setToast('Could not save trading rules.')
    }
  }

  const attentionCount = data?.signals.filter(signal => signal.outcome === 'MANUAL_REVIEW').length ?? 0
  const navLink = (item: typeof primaryNav[number]) => <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMobileNav(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
    <item.icon size={18} strokeWidth={1.9} /><span>{item.label}</span>{item.to === '/signals' && attentionCount > 0 && <small>{attentionCount}</small>}
  </NavLink>

  return <div className="app-frame">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand-row"><div className="brand-symbol"><Activity size={19} strokeWidth={2.5} /></div><div className="brand-name">meridian<span>.</span></div><button className="mobile-close icon-button" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={19} /></button></div>
      <div className="sidebar-context"><span className="context-mark">M</span><div><strong>Mani signals</strong><small>Trading workspace</small></div></div>
      <nav className="main-nav" aria-label="Main navigation"><div className="nav-section-label">WORKSPACE</div>{primaryNav.map(navLink)}<div className="nav-section-label nav-section-secondary">ADMIN</div>{secondaryNav.map(navLink)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-runtime"><span className={`runtime-dot ${data?.status.health === 'HEALTHY' ? 'healthy' : 'unhealthy'}`} /><div><strong>{data?.status.health === 'HEALTHY' ? 'System connected' : 'Check system status'}</strong><small>{data?.status.mode ?? 'PAPER'} mode · mock data</small></div></div></div>
    </aside>
    {mobileNav && <div className="mobile-scrim" onClick={() => setMobileNav(false)} />}
    <div className="main-column">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-button" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={21} /></button><span>MANI SIGNALS</span><span className="topbar-slash">/</span><strong>{page.title}</strong></div><div className="topbar-right"><span className="demo-pill">MOCK DATA</span><span className="topbar-clock">{timeSeconds(clock)} IST</span><button className="emergency-top" onClick={() => setPendingAction('EMERGENCY_STOP')}><CircleStop size={15} /> Emergency stop</button></div></header>
      <main className="content">{loadError ? <ErrorState title="Trading data unavailable" description="Refresh when the service is available." /> : !data ? <LoadingState /> : <DataContext.Provider value={{ ...data, setSettings: saveSettings, requestAction: setPendingAction, openSignal: setSelectedSignal, openPosition: setSelectedPosition, notice: setToast }}><div className="page-heading"><div><div className="page-kicker">{location.pathname === '/' ? `SESSION / ${date(data.status.sessionDate).toUpperCase()}` : 'MANI SIGNALS / WORKSPACE'}</div><h1>{page.title}</h1><p>{page.subtitle}</p></div></div><Routes><Route path="/" element={<DashboardPage />} /><Route path="/signals" element={<SignalsPage />} /><Route path="/positions" element={<PositionsPage />} /><Route path="/trades" element={<TradesPage />} /><Route path="/logs" element={<LogsPage />} /><Route path="/settings" element={<SettingsPage />} /><Route path="*" element={<EmptyState title="Page not found" description="Choose a section from the navigation." />} /></Routes></DataContext.Provider>}</main>
    </div>
    {selectedSignal && <SignalDrawer signal={selectedSignal} close={() => setSelectedSignal(null)} />}
    {selectedPosition && <PositionDrawer position={selectedPosition} signal={data?.signals.find(signal => signal.id === selectedPosition.signalId)} close={() => setSelectedPosition(null)} />}
    {pendingAction && <ConfirmationModal title={actionLabels[pendingAction]} description={actionDescriptions[pendingAction]} danger={pendingAction === 'CLOSE_ALL_POSITIONS' || pendingAction === 'EMERGENCY_STOP'} confirmLabel={`Confirm ${actionLabels[pendingAction].toLowerCase()}`} onCancel={() => setPendingAction(null)} onConfirm={confirmAction} />}
    {toast && <div className="toast" role="status">{toast}<button onClick={() => setToast(null)} aria-label="Dismiss notification"><X size={15} /></button></div>}
  </div>
}

export default function App() { return <BrowserRouter><AppShell /></BrowserRouter> }
