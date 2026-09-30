import { useMemo, useState } from 'react'
import { ListFilter, Search } from 'lucide-react'
import { useAppData } from '../App'
import { Badge, EmptyState, LogLevelBadge, SectionTitle } from '../components/ui'
import { date, timeSeconds } from '../lib/format'
import type { LogLevel } from '../types'

export function LogsPage() {
  const { logs, openSignal, signals, openPosition, positions } = useAppData()
  const [level, setLevel] = useState<LogLevel | 'ALL'>('ALL')
  const [query, setQuery] = useState('')
  const shown = useMemo(() => logs.filter(log => (level === 'ALL' || log.level === level) && `${log.message} ${log.detail ?? ''} ${log.signalId ?? ''}`.toLowerCase().includes(query.toLowerCase())), [logs, level, query])
  return <section className="panel page-panel"><div className="page-panel-head"><SectionTitle title="Event log" subtitle="Filter operational events by severity or search their details" action={<Badge tone="neutral">{logs.length} EVENTS</Badge>} /><div className="table-tools"><div className="tabs" role="tablist" aria-label="Log level">{(['ALL', 'INFO', 'WARNING', 'ERROR', 'TRADE', 'SYSTEM'] as const).map(item => <button role="tab" aria-selected={level === item} key={item} className={level === item ? 'selected' : ''} onClick={() => setLevel(item)}>{item === 'ALL' ? 'All events' : item}</button>)}</div><label className="search-box"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search events..." aria-label="Search logs" /></label></div></div>{shown.length ? <div className="log-list">{shown.map(log => <div className="log-row" key={log.id}><span className="log-time">{date(log.at)}<strong>{timeSeconds(log.at)} IST</strong></span><LogLevelBadge level={log.level} /><div className="log-content"><strong>{log.message}</strong><p>{log.detail}</p></div><div className="log-ref">{log.positionId && <button onClick={() => { const position = positions.find(item => item.id === log.positionId); if (position) openPosition(position) }}>{log.positionId}</button>}{log.signalId && <button onClick={() => { const signal = signals.find(item => item.id === log.signalId); if (signal) openSignal(signal) }}>{log.signalId}</button>}</div></div>)}</div> : <EmptyState title="No events found" description="Try another level or search term." />}<div className="panel-footer"><span><ListFilter size={14} /> Showing {shown.length} events</span><span>All timestamps IST</span></div></section>
}
