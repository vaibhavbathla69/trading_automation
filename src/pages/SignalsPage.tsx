import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useAppData } from '../App'
import { SignalTable } from '../components/tables'
import { EmptyState, SectionTitle } from '../components/ui'

const filters = ['All', 'Waiting', 'Executed', 'Review', 'Rejected'] as const

export function SignalsPage() {
  const { signals, openSignal } = useAppData()
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')
  const [query, setQuery] = useState('')
  const shown = useMemo(() => [...signals].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)).filter(signal => {
    const matchesFilter = filter === 'All' || (filter === 'Review' ? signal.outcome === 'MANUAL_REVIEW' : signal.outcome === filter.toUpperCase())
    return matchesFilter && `${signal.underlying} ${signal.strike} ${signal.optionType} ${signal.rawMessage}`.toLowerCase().includes(query.toLowerCase())
  }), [signals, filter, query])
  const count = (name: typeof filters[number]) => name === 'All' ? signals.length : signals.filter(signal => signal.outcome === (name === 'Review' ? 'MANUAL_REVIEW' : name.toUpperCase())).length
  return <section className="panel page-panel">
    <div className="page-panel-head"><SectionTitle title="All signals" /><div className="table-tools"><div className="tabs" role="tablist" aria-label="Signal status">{filters.map(item => <button key={item} role="tab" aria-selected={filter === item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item} <span className={item === 'Review' && count(item) > 0 ? 'tab-alert' : ''}>{count(item)}</span></button>)}</div><label className="search-box"><Search size={16} /><input placeholder="Search signals" value={query} onChange={event => setQuery(event.target.value)} aria-label="Search signals" /></label></div></div>
    {shown.length ? <SignalTable signals={shown} onOpen={openSignal} /> : <EmptyState title="No signals found" description="Try another status or search term." />}
    <div className="panel-footer">{shown.length} of {signals.length} signals · Source: Mani Telegram</div>
  </section>
}
