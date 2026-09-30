import { useMemo, useState } from 'react'
import { Activity, ArrowRight, Clock3, Layers3, Search, ShieldCheck } from 'lucide-react'
import { useAppData } from '../App'
import { PositionTable } from '../components/tables'
import { Badge, EmptyState, MetricCard, SectionTitle } from '../components/ui'
import { money, signedMoney } from '../lib/format'

export function PositionsPage() {
  const { positions, openPosition, requestAction } = useAppData()
  const [query, setQuery] = useState('')
  const shown = useMemo(() => positions.filter(position => `${position.underlying} ${position.strike} ${position.optionType}`.toLowerCase().includes(query.toLowerCase())), [positions, query])
  const pnl = positions.reduce((sum, item) => sum + item.unrealizedPnL, 0)
  const deployed = positions.reduce((sum, item) => sum + item.averageEntry * item.quantity, 0)
  return <>
    <div className="position-metrics"><MetricCard label="Open positions" value={String(positions.length).padStart(2, '0')} icon={<Layers3 size={19} />} foot="Actively monitored" /><MetricCard label="Unrealized P&L" value={signedMoney(pnl)} icon={<Activity size={19} />} tone={pnl >= 0 ? 'positive' : 'negative'} foot="Marked to latest LTP" /><MetricCard label="Capital deployed" value={money(deployed, 0)} icon={<ShieldCheck size={19} />} foot="Across all open trades" /><MetricCard label="Earliest opened" value={positions.length ? '10:16' : '—'} icon={<Clock3 size={19} />} foot="Indian Standard Time" /></div>
    <section className="panel page-panel"><div className="page-panel-head"><SectionTitle title="Open positions" subtitle="Click a row for fills, source signal, updates, and timeline" action={<Badge tone="green" dot>LIVE MONITORING</Badge>} /><div className="table-tools"><div className="table-intro">Tracking {positions.length} open {positions.length === 1 ? 'position' : 'positions'} <span>·</span> {positions.reduce((sum, item) => sum + item.quantity, 0)} total quantity</div><label className="search-box"><Search size={16} /><input placeholder="Search positions..." value={query} onChange={event => setQuery(event.target.value)} aria-label="Search positions" /></label></div></div>{shown.length ? <PositionTable positions={shown} onOpen={openPosition} /> : <EmptyState title="No positions found" description="Try a different instrument search." />}<div className="panel-footer"><span><span className="tiny-dot green" /> Prices shown from mock API</span><button className="text-action danger-text" onClick={() => requestAction('CLOSE_ALL_POSITIONS')}>Close all positions <ArrowRight size={15} /></button></div></section>
    <div className="explainer-strip"><div><strong>Position lifecycle</strong><p>Signal → entry trigger → order fill → live position → target, stop loss, or update → closed trade.</p></div><span className="explainer-icon"><Activity size={22} /></span></div>
  </>
}
