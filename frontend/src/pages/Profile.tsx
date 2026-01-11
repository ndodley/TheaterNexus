import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext.tsx'
import { api, imageUrl } from '../api'

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(user || null)
  const [uploading, setUploading] = useState(false)
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

  async function refreshMe() {
    try {
      const { data } = await api.get('/api/auth/me/')
      setProfile(data)
    } catch {}
  }

  async function onUploadAvatar(file: File) {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('avatar', file)
      await api.put('/api/auth/avatar/', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      await refreshMe()
    } finally {
      setUploading(false)
    }
  }

  async function onRemoveAvatar() {
    setUploading(true)
    try {
      await api.delete('/api/auth/avatar/')
      await refreshMe()
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    refreshMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="container fade-in" style={{paddingTop:24, paddingBottom:24}}>
      <div className="card" style={{display:'grid', gridTemplateColumns:'200px 1fr', gap:18}}>
        <div style={{display:'grid', placeItems:'center'}}>
          {avatarSrc ? (
            <img src={avatarSrc} alt={profile?.username || ''} style={{width:160, height:160, objectFit:'cover', borderRadius:'50%', boxShadow:'var(--shadow)'}} />
          ) : null}
          <div style={{marginTop:12, display:'flex', gap:8}}>
            <label className="btn btn-ghost" style={{cursor:'pointer'}}>
              <input type="file" accept="image/*" style={{display:'none'}} onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadAvatar(f) }} />
              {uploading ? 'Uploading…' : 'Upload Photo'}
            </label>
            {profile?.avatar && (
              <button className="btn btn-ghost" onClick={onRemoveAvatar} disabled={uploading}>Remove Photo</button>
            )}
          </div>
        </div>
        <div style={{padding:16}}>
          <h2 style={{marginTop:0}}>My Profile</h2>
          <div style={{marginTop:12, display:'grid', gridTemplateColumns:'repeat(2, minmax(0,1fr))', gap:12}}>
            <div className="card" style={{padding:12}}>
              <small style={{opacity:0.8}}>Username</small>
              <div>{profile?.username}</div>
            </div>
            <div className="card" style={{padding:12}}>
              <small style={{opacity:0.8}}>Email</small>
              <div>{profile?.email}</div>
            </div>
            <div className="card" style={{padding:12}}>
              <small style={{opacity:0.8}}>Name</small>
              <div>{[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—'}</div>
            </div>
            <div className="card" style={{padding:12}}>
              <small style={{opacity:0.8}}>Phone</small>
              <div>{profile?.phone_number || '—'}</div>
            </div>
            <div className="card" style={{padding:12}}>
              <small style={{opacity:0.8}}>Birth Date</small>
              <div>{profile?.date_of_birth || '—'}</div>
            </div>
            <div className="card" style={{padding:12}}>
              <small style={{opacity:0.8}}>Role</small>
              <div>{profile?.role}</div>
            </div>
          </div>
          <div style={{marginTop:16, display:'flex', gap:8}}>
            <Link to="/orders" className="btn btn-ghost">View Orders</Link>
            <Link to="/my-reviews" className="btn btn-ghost">My Reviews</Link>
            <Link to="/my-favorites" className="btn btn-ghost">My Favorites</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
