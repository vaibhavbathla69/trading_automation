import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { useAppData } from '../App'
import type { UserProfile } from '../types'

export function ProfilePage() {
  const { profile, setProfile } = useAppData()
  const [draft, setDraft] = useState<UserProfile>(profile)
  useEffect(() => setDraft(profile), [profile])
  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => setDraft(current => ({ ...current, [key]: value }))
  const dirty = JSON.stringify(draft) !== JSON.stringify(profile)
  const valid = draft.fullName.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()) && (draft.phone.trim() === '' || /^[+\d ()-]{7,20}$/.test(draft.phone.trim()))

  return <div className="profile-layout">
    <div className="profile-intro"><div className="profile-monogram" aria-hidden="true">{draft.fullName.trim().charAt(0).toUpperCase() || '·'}</div><div><h2>{profile.fullName || 'Your profile'}</h2><span>Personal details</span></div></div>
    <form className="profile-form" onSubmit={event => { event.preventDefault(); if (dirty && valid) setProfile({ ...draft, fullName: draft.fullName.trim(), email: draft.email.trim(), phone: draft.phone.trim() }) }}>
      <div className="profile-field"><label htmlFor="profile-name">Full name</label><input id="profile-name" autoComplete="name" value={draft.fullName} onChange={event => update('fullName', event.target.value)} required /></div>
      <div className="profile-field"><label htmlFor="profile-email">Email</label><input id="profile-email" type="email" autoComplete="email" value={draft.email} onChange={event => update('email', event.target.value)} required /></div>
      <div className="profile-field"><label htmlFor="profile-phone">Phone</label><input id="profile-phone" type="tel" autoComplete="tel" value={draft.phone} onChange={event => update('phone', event.target.value)} /></div>
      <div className="profile-field"><label htmlFor="profile-timezone">Time zone</label><select id="profile-timezone" value={draft.timezone} onChange={event => update('timezone', event.target.value)}><option value="Asia/Kolkata">India (IST)</option><option value="Europe/London">United Kingdom</option><option value="UTC">UTC</option></select></div>
      <div className="profile-actions"><span>{dirty ? valid ? 'Unsaved changes' : 'Add a name and valid email' : 'No unsaved changes'}</span><button className="button button-primary" type="submit" disabled={!dirty || !valid}><Save size={15} /> Save profile</button></div>
    </form>
  </div>
}
