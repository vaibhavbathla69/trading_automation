import { useMemo, useState } from 'react'
import { AlertCircle, Filter, Radio, Search } from 'lucide-react'
import { useAppData } from '../App'
import { SignalTable } from '../components/tables'
import { Badge, EmptyState, SectionTitle } from '../components/ui'

const filters = ['All signals', 'Waiting', 'Executed', 'Review', 'Rejected'] as const

export function SignalsPage() {
  const { signals, openSignal } = useAppData()
  const [filter, setFilter] = useState<(typeof filters)[number]>('All signals')
  const [query, setQuery] = useState('')
  const shown = useMemo(() => [...signals].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)).filter(signal => {
    const matchesFilter = filter === 'All signals' || (filter === 'Review' ? signal.outcome === 'MANUAL_REVIEW' : signal.outcome === filter.toUpperCase())
    const matchesQuery = `${signal.underlying} ${signal.strike} ${signal.optionType} ${signal.rawMessage}`.toLowerCase().includes(query.toLowerCase())
    return matchesFilter && matchesQuery
  }), [signals, filter, query])
  const reviewCount = signals.filter(signal => signal.outcome === 'MANUAL_REVIEW').length
  return <>
    {reviewCount > 0 && <div className="attention-banner"><div className="attention-icon"><AlertCircle size={19} /></div><div><strong>{reviewCount} signal requires manual review</strong><p>Ambiguous fields are held before any order request is made.</p></div><button onClick={() => setFilter('Review')}>Review signal</button></div>}
    <section className="panel page-panel"><div className="page-panel-head"><SectionTitle title="Signal inbox" subtitle="Every incoming call and the system's interpretation" action={<Badge tone="neutral">{signals.length} TOTAL</Badge>} /><div className="table-tools"><div className="tabs" role="tablist" aria-label="Signal status">{filters.map(item => <button key={item} role="tab" aria-selected={filter === item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><div className="tool-right"><label className="search-box"><Search size={16} /><input placeholder="Search signals..." value={query} onChange={event => setQuery(event.target.value)} aria-label="Search signals" /></label><span className="filter-decoration"><Filter size={16} /></span></div></div></div>{shown.length ? <SignalTable signals={shown} onOpen={openSignal} /> : <EmptyState title="No signals found" description="Try another status or search term." />}<div className="panel-footer"><span><Radio size={14} /> Source: Mani Telegram</span><span>Showing {shown.length} of {signals.length} signals</span></div></section>
    <div className="explainer-strip"><div><strong>Trace every decision</strong><p>Open a signal to compare the original Telegram message with parsed fields, confidence, and the action taken.</p></div><span className="explainer-icon"><Radio size={22} /></span></div>
  </>
}
