import { useEffect, useState } from 'react'
import { RotateCcw, Save } from 'lucide-react'
import { useAppData } from '../App'
import { ConfirmationModal, SectionTitle } from '../components/ui'
import type { TradingSettings } from '../types'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="setting-field"><span>{label}</span>{children}</label>
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="setting-toggle"><span><strong>{label}</strong></span><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} /><i /></label>
}

export function SettingsPage() {
  const { settings, setSettings } = useAppData()
  const [draft, setDraft] = useState<TradingSettings>(settings)
  const [confirm, setConfirm] = useState(false)
  useEffect(() => setDraft(settings), [settings])
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings)
  const valid = [draft.fixedLots, draft.capitalPerTrade, draft.maxTradesPerDay, draft.maxSimultaneousPositions, draft.maxCapitalDeployed, draft.maxDailyLoss, draft.maxSignalAgeSeconds].every(value => Number.isFinite(value) && value > 0)
    && [draft.maxEntrySlippagePercent, draft.maxEntryDistancePercent].every(value => Number.isFinite(value) && value >= 0)
    && (!draft.forceSquareOff || /^([01]\d|2[0-3]):[0-5]\d$/.test(draft.squareOffTime))
  const update = <K extends keyof TradingSettings>(key: K, value: TradingSettings[K]) => setDraft(current => ({ ...current, [key]: value }))

  return <div className="settings-layout"><div className="settings-main">
    <section className="panel settings-panel"><SectionTitle title="Trading" /><div className="setting-fields"><Toggle label="Trading enabled" checked={draft.tradingEnabled} onChange={value => update('tradingEnabled', value)} /><div className="settings-two-col"><Field label="Mode"><select value={draft.mode} onChange={event => update('mode', event.target.value as TradingSettings['mode'])}><option value="PAPER">Paper</option><option value="LIVE">Live</option></select></Field><Field label="Broker"><select value={draft.broker} onChange={event => update('broker', event.target.value)}><option>Angel One</option></select></Field></div><Field label="Telegram source"><select value={draft.telegramSource} onChange={event => update('telegramSource', event.target.value)}><option>Mani Telegram</option></select></Field></div></section>

    <section className="panel settings-panel"><SectionTitle title="Position sizing" /><div className="setting-fields"><div className="segmented"><button className={draft.sizingMethod === 'LOTS' ? 'selected' : ''} onClick={() => update('sizingMethod', 'LOTS')}>Fixed lots</button><button className={draft.sizingMethod === 'CAPITAL' ? 'selected' : ''} onClick={() => update('sizingMethod', 'CAPITAL')}>Fixed capital</button></div>{draft.sizingMethod === 'LOTS' ? <Field label="Lots per trade"><input type="number" min="1" value={draft.fixedLots} onChange={event => update('fixedLots', Number(event.target.value))} /></Field> : <Field label="Capital per trade (₹)"><input type="number" min="1" value={draft.capitalPerTrade} onChange={event => update('capitalPerTrade', Number(event.target.value))} /></Field>}</div></section>

    <section className="panel settings-panel"><SectionTitle title="Risk limits" /><div className="setting-fields"><div className="settings-two-col"><Field label="Trades per day"><input type="number" min="1" value={draft.maxTradesPerDay} onChange={event => update('maxTradesPerDay', Number(event.target.value))} /></Field><Field label="Open positions"><input type="number" min="1" value={draft.maxSimultaneousPositions} onChange={event => update('maxSimultaneousPositions', Number(event.target.value))} /></Field><Field label="Capital deployed (₹)"><input type="number" min="1" value={draft.maxCapitalDeployed} onChange={event => update('maxCapitalDeployed', Number(event.target.value))} /></Field><Field label="Daily loss (₹)"><input type="number" min="1" value={draft.maxDailyLoss} onChange={event => update('maxDailyLoss', Number(event.target.value))} /></Field><Field label="Entry slippage (%)"><input type="number" min="0" step="0.1" value={draft.maxEntrySlippagePercent} onChange={event => update('maxEntrySlippagePercent', Number(event.target.value))} /></Field><Field label="Signal age (seconds)"><input type="number" min="1" value={draft.maxSignalAgeSeconds} onChange={event => update('maxSignalAgeSeconds', Number(event.target.value))} /></Field></div><Toggle label="Reject duplicate signals" checked={draft.rejectDuplicateSignals} onChange={value => update('rejectDuplicateSignals', value)} /></div></section>

    <section className="panel settings-panel"><SectionTitle title="Entry & exit" /><div className="setting-fields"><div className="settings-two-col"><Field label="Entry distance (%)"><input type="number" min="0" step="0.1" value={draft.maxEntryDistancePercent} onChange={event => update('maxEntryDistancePercent', Number(event.target.value))} /></Field><Field label="Order type"><select value={draft.orderType} onChange={event => update('orderType', event.target.value as TradingSettings['orderType'])}><option value="MARKET">Market</option><option value="LIMIT">Limit</option></select></Field></div><Toggle label="Skip if price moved too far" checked={draft.skipMovedPrice} onChange={value => update('skipMovedPrice', value)} /><Field label="Target rule"><select value={draft.targetRule} onChange={event => update('targetRule', event.target.value as TradingSettings['targetRule'])}><option value="EXIT_FIRST">Exit all at first target</option><option value="PARTIAL_FIRST">Partial exit at first target</option><option value="HOLD_UPPER">Hold toward upper target</option><option value="FOLLOW_UPDATES">Follow Mani updates only</option></select></Field></div></section>

    <section className="panel settings-panel"><SectionTitle title="Session close" /><div className="setting-fields"><Toggle label="Force square off" checked={draft.forceSquareOff} onChange={value => update('forceSquareOff', value)} /><Field label="Square-off time (IST)"><input type="time" value={draft.squareOffTime} onChange={event => update('squareOffTime', event.target.value)} disabled={!draft.forceSquareOff} /></Field><Toggle label="Allow overnight positions" checked={draft.allowOvernight} onChange={value => update('allowOvernight', value)} /></div></section>
  </div><div className="settings-savebar"><span>{!valid ? 'Enter valid positive limits' : dirty ? 'Unsaved changes' : 'All changes saved'}</span><div><button className="button button-secondary" disabled={!dirty} onClick={() => setDraft(settings)}><RotateCcw size={15} /> Reset</button><button className="button button-primary" disabled={!dirty || !valid} onClick={() => setConfirm(true)}><Save size={15} /> Save rules</button></div></div>{confirm && <ConfirmationModal title="Save trading rules" description={`Apply these changes to the ${draft.mode.toLowerCase()} trading workspace?`} confirmLabel="Save rules" onCancel={() => setConfirm(false)} onConfirm={() => { setSettings(draft); setConfirm(false) }} />}</div>
}
