import { useMemo, useState } from 'react'
import { CalendarDays, Search, TrendingUp } from 'lucide-react'
import { useAppData } from '../App'
import { TradeTable } from '../components/tables'
import { Badge, EmptyState, MetricCard, SectionTitle } from '../components/ui'
import { signedMoney } from '../lib/format'

export function TradesPage() {
  const { trades, status } = useAppData()
  const [period, setPeriod] = useState<'Today' | 'Week' | 'Month'>('Today')
  const [query, setQuery] = useState('')
  const [result, setResult] = useState('All results')
  const [reason, setReason] = useState('All exits')
  const shown = useMemo(() => trades.filter(trade => {
    const days = (new Date(`${status.sessionDate}T23:59:59+05:30`).getTime() - new Date(trade.closedAt).getTime()) / 86400000
    return (period === 'Month' || days <= (period === 'Week' ? 7 : 1)) && trade.underlying.toLowerCase().includes(query.toLowerCase()) && (result === 'All results' || (result === 'Profit' ? trade.realizedPnL >= 0 : trade.realizedPnL < 0)) && (reason === 'All exits' || trade.exitReason === reason)
  }), [trades, period, query, result, reason, status.sessionDate])
  const realized = shown.reduce((sum, trade) => sum + trade.realizedPnL, 0)
  return <><div className="trade-top"><MetricCard label="Realized P&L" value={signedMoney(realized)} icon={<TrendingUp size={19} />} tone={realized >= 0 ? 'positive' : 'negative'} foot={`${period.toLowerCase()} · ${shown.length} closed trades`} /><MetricCard label="Closed trades" value={String(shown.length).padStart(2, '0')} icon={<CalendarDays size={19} />} foot={`Selected ${period.toLowerCase()}`} /></div><section className="panel page-panel"><div className="page-panel-head"><SectionTitle title="Closed trades" subtitle="Historical fills, outcomes, and broker references" action={<Badge tone="neutral">{shown.length} RESULTS</Badge>} /><div className="table-tools trade-tools"><div className="tabs" role="tablist" aria-label="Trade period">{(['Today', 'Week', 'Month'] as const).map(item => <button role="tab" aria-selected={period === item} key={item} className={period === item ? 'selected' : ''} onClick={() => setPeriod(item)}>{item}</button>)}</div><div className="tool-right"><label className="search-box"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Instrument..." aria-label="Filter instrument" /></label><select value={result} onChange={event => setResult(event.target.value)} aria-label="Filter profit or loss"><option>All results</option><option>Profit</option><option>Loss</option></select><select value={reason} onChange={event => setReason(event.target.value)} aria-label="Filter exit reason"><option>All exits</option><option value="TARGET">Target</option><option value="STOP_LOSS">Stop loss</option><option value="MANI_UPDATE">Mani update</option><option value="SQUARE_OFF">Square off</option><option value="MANUAL">Manual</option></select></div></div></div>{shown.length ? <TradeTable trades={shown} /> : <EmptyState title="No closed trades" description="Adjust the period or filters to see more history." />}<div className="panel-footer">Showing {shown.length} of {trades.length} recorded trades</div></section></>
}
