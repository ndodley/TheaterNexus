import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext.tsx'
import { api, imageUrl } from '../api'

export default function ProfilePage() {
  const { user, refreshMe } = useAuth()
  const [profile, setProfile] = useState(user || null)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone_number: user?.phone_number || '',
    date_of_birth: (user?.date_of_birth || '') as string,
  })

  const avatarSrc = profile?.avatar_url ? imageUrl(profile.avatar_url) : (profile?.avatar ? imageUrl(profile.avatar) : imageUrl('/media/default_poster/default_avatar.jpg'))

  if (!user) {
    return (
      <section className="container" style={{paddingTop:24, paddingBottom:24}}>
        <div className="card" style={{padding:16}}>
          <h2 style={{marginTop:0}}>Profile</h2>
          <p>You are not signed in.</p>
          <div style={{marginTop:12, display:'flex', gap:8}}>
            <Link to="/login" className="btn btn-primary">Sign in</Link>
            <Link to="/register" className="btn btn-ghost">Create account</Link>
          </div>
        </div>
      </section>
    )
  }

  async function loadMe() {
    try {
      const { data } = await api.get('/api/auth/me/')
      setProfile(data)
      setForm({
        first_name: data?.first_name || '',
        last_name: data?.last_name || '',
        phone_number: data?.phone_number || '',
        date_of_birth: (data?.date_of_birth || '') as string,
      })
    } catch {}
  }

  async function onUploadAvatar(file: File) {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('avatar', file)
      await api.put('/api/auth/avatar/', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      await loadMe()
      await refreshMe()
    } finally {
      setUploading(false)
    }
  }

  async function onRemoveAvatar() {
    setUploading(true)
    try {
      await api.delete('/api/auth/avatar/')
      await loadMe()
      await refreshMe()
    } finally {
      setUploading(false)
    }
  }

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        phone_number: form.phone_number,
        date_of_birth: form.date_of_birth || null,
      }
      const { data } = await api.patch('/api/auth/me/', payload)
      setProfile(data)
      setEditing(false)
      await refreshMe()
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    loadMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="container fade-in" style={{ paddingTop: 24, paddingBottom: 24 }}>
      <div className="profileLayout">
        <div className="profileSidebar">
          {avatarSrc ? (
            <img className="profileAvatar" src={avatarSrc} alt={profile?.username || ''} />
          ) : null}
          <div className="profileAvatarActions">
            <label className="btn btn-ghost" style={{cursor:'pointer'}}>
              <input type="file" accept="image/*" style={{display:'none'}} onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadAvatar(f) }} />
              {uploading ? 'Uploading…' : 'Upload Photo'}
            </label>
            {profile?.avatar && (
              <button className="btn btn-ghost" onClick={onRemoveAvatar} disabled={uploading}>Remove Photo</button>
            )}
          </div>
        </div>
        <div className="profileMain">
          <div className="profileHeader">
            <div>
              <h2 className="profileTitle">My Profile</h2>
              <div className="profileSubtitle">Manage your personal details and profile photo.</div>
            </div>
            <div className="profileHeaderActions">
              {!editing ? (
                <button className="btn btn-primary" onClick={() => { setEditing(true); setError(null) }}>Edit</button>
              ) : (
                <button className="btn btn-ghost" onClick={() => { setEditing(false); setError(null); setForm({
                  first_name: profile?.first_name || '',
                  last_name: profile?.last_name || '',
                  phone_number: profile?.phone_number || '',
                  date_of_birth: (profile?.date_of_birth || '') as string,
                }) }}>Cancel</button>
              )}
            </div>
          </div>

          {error ? (
            <div className="card" style={{ padding: 12, borderColor: 'rgba(239,68,68,0.35)' }}>{error}</div>
          ) : null}

          <div className="profileGrid">
            <div className="profileField">
              <div className="profileLabel">Username</div>
              <div className="profileValue">{profile?.username}</div>
            </div>
            <div className="profileField">
              <div className="profileLabel">Email</div>
              <div className="profileValue">{profile?.email}</div>
            </div>

            {!editing ? (
              <>
                <div className="profileField">
                  <div className="profileLabel">Name</div>
                  <div className="profileValue">{[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—'}</div>
                </div>
                <div className="profileField">
                  <div className="profileLabel">Phone</div>
                  <div className="profileValue">{profile?.phone_number || '—'}</div>
                </div>
                <div className="profileField">
                  <div className="profileLabel">Birth Date</div>
                  <div className="profileValue">{profile?.date_of_birth || '—'}</div>
                </div>
                <div className="profileField">
                  <div className="profileLabel">Role</div>
                  <div className="profileValue">{profile?.role}</div>
                </div>
              </>
            ) : (
              <form className="profileForm" onSubmit={onSaveProfile}>
                <div className="profileFormGrid">
                  <label className="profileInput">
                    <span>First name</span>
                    <input value={form.first_name} onChange={(e) => setForm(prev => ({ ...prev, first_name: e.target.value }))} autoComplete="given-name" />
                  </label>
                  <label className="profileInput">
                    <span>Last name</span>
                    <input value={form.last_name} onChange={(e) => setForm(prev => ({ ...prev, last_name: e.target.value }))} autoComplete="family-name" />
                  </label>
                  <label className="profileInput">
                    <span>Phone</span>
                    <input value={form.phone_number} onChange={(e) => setForm(prev => ({ ...prev, phone_number: e.target.value }))} autoComplete="tel" />
                  </label>
                  <label className="profileInput">
                    <span>Birth date</span>
                    <input type="date" value={form.date_of_birth || ''} onChange={(e) => setForm(prev => ({ ...prev, date_of_birth: e.target.value }))} />
                  </label>
                </div>
                <div className="profileFormActions">
                  <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
                </div>
              </form>
            )}
          </div>

          <div className="profileLinks">
            <Link to="/orders" className="btn btn-ghost">View Orders</Link>
            <Link to="/my-reviews" className="btn btn-ghost">My Reviews</Link>
            <Link to="/my-favorites" className="btn btn-ghost">My Favorites</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
