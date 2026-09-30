import { useNavigate } from 'react-router-dom'
import { Activity, ArrowRight, ArrowUpRight, CircleAlert, CirclePause, Clock3, Gauge, Landmark, Layers3, ShieldCheck, TrendingDown, TrendingUp, Zap } from 'lucide-react'
import { useAppData } from '../App'
import { ConnectionStatus, ErrorState, LogLevelBadge, MetricCard, SectionTitle, StatusBadge } from '../components/ui'
import { PositionTable } from '../components/tables'
import { money, number, signedMoney, time, timeSeconds } from '../lib/format'

export function DashboardPage() {
  const { positions, signals, trades, logs, status, requestAction, openPosition, openSignal } = useAppData()
  const navigate = useNavigate()
  const pending = signals.filter(signal => signal.outcome === 'WAITING')
  const review = signals.filter(signal => signal.outcome === 'MANUAL_REVIEW' || signal.outcome === 'REJECTED')
  const todayTrades = trades.filter(trade => trade.closedAt.slice(0, 10) === status.sessionDate)
  const realized = todayTrades.reduce((sum, trade) => sum + trade.realizedPnL, 0)
  const unrealized = positions.reduce((sum, position) => sum + position.unrealizedPnL, 0)
  const deployed = positions.reduce((sum, position) => sum + position.averageEntry * position.quantity, 0)
  const recent = [...signals].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)).slice(0, 4)
  const lastSignal = [...signals].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))[0]
  const unhealthy = !status.backendAvailable || [status.broker.state, status.telegram.state, status.marketData.state].some(state => state !== 'CONNECTED')
  return <>
    {unhealthy && <ErrorState title="Trading service needs attention" description="A required connection is unavailable or degraded. Check the connection panel and system logs before relying on live status." />}
    <div className="system-banner"><div className="system-banner-left"><div className="system-big-icon"><ShieldCheck size={20} /></div><div><div className="system-banner-title"><strong>{status.emergencyStopped ? 'Emergency stop requested' : unhealthy ? 'System degraded' : status.tradingEnabled ? 'System operational' : 'Trading paused'}</strong><StatusBadge status={unhealthy ? 'DEGRADED' : status.tradingEnabled ? 'HEALTHY' : 'DEGRADED'} text={status.tradingEnabled ? 'Trading enabled' : 'Trading paused'} /></div><p>{unhealthy ? 'Review service connections and recent errors.' : status.tradingEnabled ? 'All connections healthy. New signals are being monitored.' : 'New entries are paused. Open positions remain visible.'}</p></div></div><div className="system-banner-right"><span className="mode-indicator"><span />{status.mode} MODE</span><div className="banner-divider" /><span className="last-signal">Last signal <strong>{lastSignal ? `${timeSeconds(lastSignal.receivedAt)} IST` : '—'}</strong></span></div></div>
    <div className="metrics-grid">
      <MetricCard label="Active positions" value={String(positions.length).padStart(2, '0')} icon={<Layers3 size={19} />} foot={<><span className="foot-dot blue" /> Across {new Set(positions.map(position => position.underlying)).size} instruments</>} />
      <MetricCard label="Pending signals" value={String(pending.length).padStart(2, '0')} icon={<Clock3 size={19} />} foot={<><span className="foot-dot amber" /> Waiting for entry</>} />
      <MetricCard label="Trades today" value={String(todayTrades.length).padStart(2, '0')} icon={<Zap size={19} />} foot={<>{signals.filter(signal => signal.outcome === 'EXECUTED').length} signals executed</>} />
      <MetricCard label="Realized P&L" value={signedMoney(realized)} icon={realized >= 0 ? <TrendingUp size={19} /> : <TrendingDown size={19} />} tone={realized >= 0 ? 'positive' : 'negative'} foot="Closed trades today" />
      <MetricCard label="Unrealized P&L" value={signedMoney(unrealized)} icon={<Activity size={19} />} tone={unrealized >= 0 ? 'positive' : 'negative'} foot="Across open positions" />
      <MetricCard label="Capital deployed" value={money(deployed, 0)} icon={<Landmark size={19} />} foot={`${number(Math.round(deployed / 75000 * 100))}% of ₹75,000 limit`} />
      <MetricCard label="Needs attention" value={String(review.length).padStart(2, '0')} icon={<CircleAlert size={19} />} foot={<><span className="foot-dot red" /> Review or rejected</>} />
      <MetricCard label="System health" value={<span className="health-value"><span />Healthy</span>} icon={<Gauge size={19} />} foot="All 3 services connected" />
    </div>
    <div className="dashboard-grid"><div className="dashboard-main">
      <section className="panel"><SectionTitle title="Active positions" subtitle="Live exposure from current signals" action={<button className="text-action" onClick={() => navigate('/positions')}>View all positions <ArrowRight size={15} /></button>} /><PositionTable positions={positions} onOpen={openPosition} compact /><div className="panel-footer"><span><span className="tiny-dot green" /> {positions.length} positions being monitored</span><span>Total exposure <strong>{money(deployed, 0)}</strong></span></div></section>
      <section className="panel recent-panel"><SectionTitle title="Recent signals" subtitle="Latest messages from Mani Telegram" action={<button className="text-action" onClick={() => navigate('/signals')}>View all signals <ArrowRight size={15} /></button>} /><div className="recent-list">{recent.map(signal => <button className="recent-signal" key={signal.id} onClick={() => openSignal(signal)}><div className={`option-mark ${signal.optionType.toLowerCase()}`}>{signal.optionType}</div><div className="recent-signal-text"><strong>{signal.underlying} {signal.strike} {signal.optionType}</strong><span>{signal.resultingAction}</span></div><StatusBadge status={signal.outcome} text={signal.outcome === 'MANUAL_REVIEW' ? 'Review' : undefined} /><time>{time(signal.receivedAt)}</time><ArrowUpRight size={16} /></button>)}</div></section>
    </div><div className="dashboard-side">
      <section className="panel side-panel"><SectionTitle title="Connections" subtitle="Live service availability" /><div className="connections"><ConnectionStatus name="Broker" detail={status.broker.name} state={status.broker.state} /><ConnectionStatus name="Telegram" detail={status.telegram.name} state={status.telegram.state} /><ConnectionStatus name="Market data" detail="Live feed" state={status.marketData.state} /></div><div className="side-panel-foot"><span className="tiny-dot green" /> Last checked {timeSeconds(status.broker.checkedAt)} IST</div></section>
      <section className="panel side-panel"><SectionTitle title="Safety controls" subtitle="Changes require confirmation" /><div className="control-list"><button onClick={() => requestAction(status.tradingEnabled ? 'PAUSE_NEW_TRADES' : 'RESUME_NEW_TRADES')}><span className="control-icon"><CirclePause size={18} /></span><span><strong>{status.tradingEnabled ? 'Pause new trades' : 'Resume new trades'}</strong><small>Control new entries</small></span><ArrowRight size={16} /></button><button onClick={() => requestAction(status.autoExecutionEnabled ? 'DISABLE_AUTO_EXECUTION' : 'ENABLE_AUTO_EXECUTION')}><span className="control-icon"><Zap size={18} /></span><span><strong>{status.autoExecutionEnabled ? 'Disable auto execution' : 'Enable auto execution'}</strong><small>Broker order automation</small></span><ArrowRight size={16} /></button><button onClick={() => requestAction('CLOSE_ALL_POSITIONS')}><span className="control-icon red"><TrendingDown size={18} /></span><span><strong>Close all positions</strong><small>Request exit of open exposure</small></span><ArrowRight size={16} /></button></div></section>
      <section className="panel side-panel"><SectionTitle title="Activity feed" subtitle="Latest system events" action={<button className="icon-link" onClick={() => navigate('/logs')} aria-label="View all logs"><ArrowUpRight size={17} /></button>} /><div className="activity-list">{logs.slice(0, 4).map(log => <div className="activity-entry" key={log.id}><div className="activity-line"><LogLevelBadge level={log.level} /><time>{time(log.at)}</time></div><strong>{log.message}</strong><p>{log.detail}</p></div>)}</div></section>
    </div></div>
  </>
}
