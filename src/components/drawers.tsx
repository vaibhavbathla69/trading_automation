import { ArrowUpRight, Clock3, FileText, Hash, X } from 'lucide-react'
import type { Position, Signal } from '../types'
import { ActivityTimeline, Badge, ErrorState, StatusBadge } from './ui'
import { date, instrument, money, signedMoney, timeSeconds } from '../lib/format'

function Drawer({ children, onClose, title, eyebrow }: { children: React.ReactNode; onClose: () => void; title: string; eyebrow: string }) {
  return <div className="drawer-scrim" onMouseDown={onClose}><aside className="drawer" onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}><div className="drawer-head"><div><span className="drawer-eyebrow">{eyebrow}</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close details"><X size={21} /></button></div><div className="drawer-content">{children}</div></aside></div>
}

function DataGrid({ entries }: { entries: { label: string; value: React.ReactNode }[] }) {
  return <div className="detail-grid">{entries.map(item => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
}

export function SignalDrawer({ signal, close }: { signal: Signal; close: () => void }) {
  return <Drawer title={instrument(signal)} eyebrow={`SIGNAL / ${signal.id.toUpperCase()}`} onClose={close}>
    <div className="drawer-summary"><StatusBadge status={signal.outcome} /><span><Clock3 size={14} /> {date(signal.receivedAt)} · {timeSeconds(signal.receivedAt)} IST</span></div>
    {signal.rejectionReason && <ErrorState title={signal.outcome === 'MANUAL_REVIEW' ? 'Manual review required' : 'Signal not executed'} description={signal.rejectionReason} />}
    <div className="detail-section"><div className="detail-section-title"><FileText size={16} /><h3>Raw Telegram message</h3></div><pre className="raw-message">{signal.rawMessage}</pre><div className="source-caption">Source: {signal.source} · Message ID {signal.id}</div></div>
    <div className="detail-section"><div className="detail-section-title"><Hash size={16} /><h3>Parsed data</h3><Badge tone={signal.confidence < .8 ? 'amber' : 'green'}>{Math.round(signal.confidence * 100)}% confidence</Badge></div><DataGrid entries={[
      { label: 'Action', value: signal.action }, { label: 'Instrument', value: instrument(signal) },
      { label: 'Expiry', value: date(signal.expiry) }, { label: 'Entry condition', value: `${signal.entryType} ${money(signal.entryPrice)}` },
      { label: 'Stop loss', value: signal.stopLoss ? money(signal.stopLoss) : 'Unclear' }, { label: 'Target range', value: `${money(signal.targetMin)}${signal.targetMax ? ` – ${money(signal.targetMax)}` : ''}` },
      { label: 'Current LTP', value: signal.ltp == null ? '—' : money(signal.ltp) }, { label: 'Broker', value: signal.broker },
    ]} /></div>
    <div className="detail-section"><div className="detail-section-title"><ArrowUpRight size={16} /><h3>Resulting action</h3></div><p className="detail-outcome">{signal.resultingAction}</p></div>
    <div className="detail-section"><div className="detail-section-title"><Clock3 size={16} /><h3>Event timeline</h3></div><ActivityTimeline events={signal.timeline} /></div>
  </Drawer>
}

export function PositionDrawer({ position, signal, close }: { position: Position; signal?: Signal; close: () => void }) {
  const slip = position.averageEntry - position.signalPrice
  return <Drawer title={instrument(position)} eyebrow={`POSITION / ${position.id.toUpperCase()}`} onClose={close}>
    <div className="drawer-summary"><StatusBadge status={position.status} /><span><Clock3 size={14} /> Opened {date(position.openedAt)} · {timeSeconds(position.openedAt)} IST</span></div>
    <div className="position-pnl-card"><span>UNREALIZED P&L</span><strong className={position.unrealizedPnL >= 0 ? 'positive' : 'negative'}>{signedMoney(position.unrealizedPnL)}</strong><small>Current LTP {money(position.ltp)} · {position.quantity} quantity</small></div>
    <div className="detail-section"><div className="detail-section-title"><Hash size={16} /><h3>Position details</h3></div><DataGrid entries={[
      { label: 'Quantity / lots', value: `${position.quantity} / ${position.lots}` }, { label: 'Expiry', value: date(position.expiry) },
      { label: 'Average fill', value: money(position.averageEntry) }, { label: 'Signal entry', value: money(position.signalPrice) },
      { label: 'Slippage', value: `${slip >= 0 ? '+' : '−'}${money(Math.abs(slip))} (${Math.abs(slip / position.signalPrice * 100).toFixed(2)}%)` },
      { label: 'Current LTP', value: money(position.ltp) }, { label: 'Stop loss', value: money(position.stopLoss) },
      { label: 'Target range', value: `${money(position.targetMin)}${position.targetMax ? ` – ${money(position.targetMax)}` : ''}` },
      { label: 'Broker order ID', value: position.brokerOrderId }, { label: 'Source signal', value: position.signalId },
    ]} /></div>
    {signal && <div className="detail-section"><div className="detail-section-title"><FileText size={16} /><h3>Original Telegram message</h3></div><pre className="raw-message">{signal.rawMessage}</pre></div>}
    <div className="detail-section"><div className="detail-section-title"><Clock3 size={16} /><h3>Event timeline</h3></div><ActivityTimeline events={position.timeline} /></div>
    <div className="detail-section"><div className="detail-section-title"><FileText size={16} /><h3>Later Mani updates</h3></div>{position.updates.length ? position.updates.map(update => <div className="update-note" key={update.at}><span>{timeSeconds(update.at)} IST</span><p>{update.message}</p></div>) : <p className="muted-copy">No follow-up messages recorded for this position.</p>}</div>
  </Drawer>
}
