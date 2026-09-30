import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useAppData } from '../App'
import { PositionTable } from '../components/tables'
import { EmptyState, SectionTitle } from '../components/ui'
import { money, signedMoney } from '../lib/format'

export function PositionsPage() {
  const { positions, openPosition, requestAction } = useAppData()
  const [query, setQuery] = useState('')
  const shown = useMemo(() => positions.filter(position => `${position.underlying} ${position.strike} ${position.optionType}`.toLowerCase().includes(query.toLowerCase())), [positions, query])
  const pnl = positions.reduce((sum, item) => sum + item.unrealizedPnL, 0)
  const deployed = positions.reduce((sum, item) => sum + item.averageEntry * item.quantity, 0)
  return <>
    <div className="page-summary"><div><span>OPEN POSITIONS</span><strong>{positions.length}</strong></div><div><span>OPEN P&L</span><strong className={pnl >= 0 ? 'positive' : 'negative'}>{signedMoney(pnl)}</strong></div><div><span>CAPITAL IN USE</span><strong>{money(deployed, 0)}</strong></div></div>
    <section className="panel page-panel"><div className="page-panel-head"><SectionTitle title="Open positions" /><div className="table-tools"><span className="table-intro">Select a position for fills and timeline</span><label className="search-box"><Search size={16} /><input placeholder="Search positions" value={query} onChange={event => setQuery(event.target.value)} aria-label="Search positions" /></label></div></div>{shown.length ? <PositionTable positions={shown} onOpen={openPosition} /> : <EmptyState title="No positions found" description="Try another instrument." />}<div className="panel-footer"><span>{shown.length} positions shown</span><button className="text-action danger-text" onClick={() => requestAction('CLOSE_ALL_POSITIONS')}>Close all positions</button></div></section>
  </>
}
