import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronRight, Pause, Play, Zap, ZapOff } from 'lucide-react'
import { useAppData } from '../App'
import { EmptyState, ErrorState, SectionTitle, StatusBadge } from '../components/ui'
import { date, instrument, money, number, signedMoney, time } from '../lib/format'
import type { ConnectionState } from '../types'

function Service({ name, state }: { name: string; state: ConnectionState }) {
  return <span className="service-item"><i className={`service-dot ${state.toLowerCase()}`} />{name}<small>{state === 'CONNECTED' ? 'Connected' : state.toLowerCase()}</small></span>
}

export function DashboardPage() {
  const { positions, signals, trades, status, settings, requestAction, openPosition, openSignal } = useAppData()
  const navigate = useNavigate()
  const todayTrades = trades.filter(trade => trade.closedAt.slice(0, 10) === status.sessionDate)
  const realized = todayTrades.reduce((sum, trade) => sum + trade.realizedPnL, 0)
  const unrealized = positions.reduce((sum, position) => sum + position.unrealizedPnL, 0)
  const deployed = positions.reduce((sum, position) => sum + position.averageEntry * position.quantity, 0)
  const attention = signals.filter(signal => ['MANUAL_REVIEW', 'REJECTED'].includes(signal.outcome)).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
  const recent = [...signals].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)).slice(0, 5)
  const pending = signals.filter(signal => signal.outcome === 'WAITING').length
  const unhealthy = !status.backendAvailable || [status.broker.state, status.telegram.state, status.marketData.state].some(state => state !== 'CONNECTED')
  return <>
    {unhealthy && <ErrorState title="Connection issue" description="A required service is unavailable or degraded. Check system logs before relying on live status." />}
    <section className="desk-status" aria-label="System status">
      <div className="desk-status-main"><div className="status-glyph" aria-hidden="true"><i /><i /><i /></div><span className={`system-indicator ${status.tradingEnabled && !unhealthy ? 'active' : 'paused'}`} /><div><strong>{status.emergencyStopped ? 'Emergency stop active' : unhealthy ? 'System needs attention' : status.tradingEnabled ? 'Monitoring signals' : 'New trades paused'}</strong><span>{status.mode === 'PAPER' ? 'Paper trading' : 'Live trading'} · Last signal {status.lastSignalAt ? time(status.lastSignalAt) : '—'} IST</span></div></div>
      <div className="service-list"><Service name="Broker" state={status.broker.state} /><Service name="Telegram" state={status.telegram.state} /><Service name="Market data" state={status.marketData.state} /></div>
      <div className="status-actions"><button onClick={() => requestAction(status.tradingEnabled ? 'PAUSE_NEW_TRADES' : 'RESUME_NEW_TRADES')}>{status.tradingEnabled ? <Pause size={14} /> : <Play size={14} />}{status.tradingEnabled ? 'Pause entries' : 'Resume entries'}</button><button onClick={() => requestAction(status.autoExecutionEnabled ? 'DISABLE_AUTO_EXECUTION' : 'ENABLE_AUTO_EXECUTION')}>{status.autoExecutionEnabled ? <ZapOff size={14} /> : <Zap size={14} />}{status.autoExecutionEnabled ? 'Disable auto' : 'Enable auto'}</button></div>
    </section>

    <section className="desk-metrics" aria-label="Session metrics">
      <div><span>Open positions</span><strong>{positions.length}</strong><small>{pending} signals waiting</small></div>
      <div><span>Realized today</span><strong className={realized >= 0 ? 'positive' : 'negative'}>{signedMoney(realized)}</strong><small>{todayTrades.length} closed trades</small></div>
      <div><span>Open P&L</span><strong className={unrealized >= 0 ? 'positive' : 'negative'}>{signedMoney(unrealized)}</strong><small>Marked to last price</small></div>
      <div><span>Capital in use</span><strong>{money(deployed, 0)}</strong><small>{number(Math.round(deployed / Math.max(1, settings.maxCapitalDeployed) * 100))}% of {money(settings.maxCapitalDeployed, 0)} limit</small></div>
    </section>

    <div className="desk-grid">
      <section className="panel desk-positions"><SectionTitle title="Open positions" action={<button className="text-action" onClick={() => navigate('/positions')}>All positions <ArrowRight size={15} /></button>} />
        {positions.length ? <div className="table-scroll"><table className="desk-table"><thead><tr><th>CONTRACT</th><th>SIZE</th><th>ENTRY → LAST</th><th>SL / TARGET</th><th>P&L</th><th aria-label="Details" /></tr></thead><tbody>{positions.map(position => <tr key={position.id} tabIndex={0} onClick={() => openPosition(position)} onKeyDown={event => { if (event.key === 'Enter') openPosition(position) }}><td><strong>{instrument(position)}</strong><small>{date(position.expiry)} expiry</small></td><td>{position.quantity}<small>{position.lots} {position.lots === 1 ? 'lot' : 'lots'}</small></td><td>{money(position.averageEntry)} <span className="table-arrow">→</span> {money(position.ltp)}</td><td>{money(position.stopLoss)} <span className="table-slash">/</span> {money(position.targetMin)}</td><td><strong className={position.unrealizedPnL >= 0 ? 'positive' : 'negative'}>{signedMoney(position.unrealizedPnL)}</strong></td><td><ChevronRight size={16} /></td></tr>)}</tbody></table></div> : <EmptyState title="No open positions" description="New positions will appear here." />}
      </section>
      <section className="panel attention-panel"><SectionTitle title="Exceptions" action={<span className="attention-count">{attention.length}</span>} />
        {attention.length ? <div className="attention-list">{attention.map(signal => <button key={signal.id} className="attention-row" onClick={() => openSignal(signal)}><div><StatusBadge status={signal.outcome} text={signal.outcome === 'MANUAL_REVIEW' ? 'Review' : 'Rejected'} /><time>{time(signal.receivedAt)} IST</time></div><strong>{instrument(signal)}</strong><p>{signal.rejectionReason}</p><ChevronRight size={16} /></button>)}</div> : <EmptyState title="All clear" description="No signals need attention." />}
      </section>
    </div>

    <section className="panel desk-signals"><SectionTitle title="Signal queue" action={<button className="text-action" onClick={() => navigate('/signals')}>All signals <ArrowRight size={15} /></button>} />
      <div className="signal-queue-head"><span>CONTRACT</span><span>ENTRY</span><span>LAST</span><span>STATE</span><span>TIME</span></div>
      {recent.map(signal => <button className="signal-queue-row" key={signal.id} onClick={() => openSignal(signal)}><strong>{instrument(signal)}</strong><span>{signal.entryType.toLowerCase()} {money(signal.entryPrice)}</span><span>{signal.ltp == null ? '—' : money(signal.ltp)}</span><StatusBadge status={signal.outcome} text={signal.outcome === 'MANUAL_REVIEW' ? 'Review' : undefined} /><time>{time(signal.receivedAt)} IST</time></button>)}
    </section>
  </>
}
