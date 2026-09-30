import type { ReactNode } from 'react'
import { AlertCircle, ArrowRight, Check, CircleDashed, LoaderCircle, X } from 'lucide-react'
import type { ConnectionState, SignalState, SystemLog } from '../types'
import { label, timeSeconds } from '../lib/format'

export function Badge({ children, tone = 'neutral', dot = false }: { children: ReactNode; tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'purple'; dot?: boolean }) {
  return <span className={`badge badge-${tone}`}>{dot && <i />}{children}</span>
}

export function stateTone(value: SignalState | string): 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'purple' {
  if (['POSITION_OPEN', 'FILLED', 'TARGET_HIT', 'EXECUTED', 'CONNECTED', 'HEALTHY'].includes(value)) return 'green'
  if (['WAITING_FOR_ENTRY', 'WAITING', 'ORDER_PENDING', 'ENTRY_TRIGGERED'].includes(value)) return 'blue'
  if (['MANUAL_REVIEW', 'PARTIALLY_EXITED', 'DEGRADED', 'WARNING'].includes(value)) return 'amber'
  if (['REJECTED', 'FAILED', 'STOP_LOSS_HIT', 'CRITICAL', 'DISCONNECTED', 'ERROR'].includes(value)) return 'red'
  return 'neutral'
}

export function StatusBadge({ status, text }: { status: string; text?: string }) {
  return <Badge tone={stateTone(status)} dot>{text ?? label(status)}</Badge>
}

export function MetricCard({ label, value, icon, foot, tone = 'default' }: { label: string; value: ReactNode; icon: ReactNode; foot?: ReactNode; tone?: 'default' | 'positive' | 'negative' }) {
  return <div className={`metric-card metric-${tone}`}><div className="metric-top"><span>{label}</span><div className="metric-icon">{icon}</div></div><div className="metric-value">{value}</div>{foot && <div className="metric-foot">{foot}</div>}</div>
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="section-title"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>
}

export function ConnectionStatus({ name, state, detail }: { name: string; state: ConnectionState; detail: string }) {
  return <div className="connection-row"><span className={`connection-icon ${state.toLowerCase()}`}><span /></span><div><strong>{name}</strong><small>{detail}</small></div><StatusBadge status={state} /></div>
}

export function ActivityTimeline({ events }: { events: { id: string; at: string; title: string; detail?: string }[] }) {
  return <div className="timeline">{events.map((event, index) => <div className="timeline-item" key={event.id}><div className={`timeline-marker ${index === 0 ? 'latest' : ''}`}><span /></div><div className="timeline-body"><span className="timeline-time">{timeSeconds(event.at)} IST</span><strong>{event.title}</strong>{event.detail && <p>{event.detail}</p>}</div></div>)}</div>
}

export function LogLevelBadge({ level }: { level: SystemLog['level'] }) {
  const tone = level === 'ERROR' ? 'red' : level === 'WARNING' ? 'amber' : level === 'TRADE' ? 'green' : level === 'SYSTEM' ? 'purple' : 'blue'
  return <Badge tone={tone}>{level}</Badge>
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><CircleDashed size={27} /><strong>{title}</strong><p>{description}</p></div>
}

export function ErrorState({ title, description }: { title: string; description: string }) {
  return <div className="error-state"><AlertCircle size={20} /><div><strong>{title}</strong><p>{description}</p></div></div>
}

export function LoadingState() { return <div className="loading-state"><LoaderCircle size={24} className="spin" />Loading trading workspace…</div> }

export function ConfirmationModal({ title, description, danger, confirmLabel, onCancel, onConfirm }: { title: string; description: string; danger?: boolean; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) {
  return <div className="modal-scrim" onMouseDown={onCancel}><div className="confirm-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={event => event.stopPropagation()}><div className={`modal-icon ${danger ? 'danger' : ''}`}>{danger ? <AlertCircle size={21} /> : <Check size={21} />}</div><button className="modal-close" onClick={onCancel} aria-label="Close"><X size={19} /></button><h2>{title}?</h2><p>{description}</p><div className="modal-actions"><button className="button button-secondary" onClick={onCancel}>Cancel</button><button className={`button ${danger ? 'button-danger' : 'button-primary'}`} onClick={onConfirm}>{confirmLabel}<ArrowRight size={15} /></button></div></div></div>
}
