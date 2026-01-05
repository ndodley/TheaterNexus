import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const form = new FormData()
      form.append('email', email)
      form.append('password', password)
      if (firstName) form.append('first_name', firstName)
      if (lastName) form.append('last_name', lastName)
      if (phone) form.append('phone_number', phone)
      if (dob) form.append('date_of_birth', dob)
      if (avatar) form.append('avatar', avatar)
      await register(form)
      navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <h1>Create account</h1>
      <form onSubmit={onSubmit} className="card" style={{ padding: 24, display: 'grid', gap: 12 }}>
        <div className="grid-2">
          <label>
            <span>First name</span>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} />
          </label>
          <label>
            <span>Last name</span>
            <input value={lastName} onChange={e => setLastName(e.target.value)} />
          </label>
        </div>
        <label>
          <span>Email</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label>
          <span>Password</span>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        <div className="grid-2">
          <label>
            <span>Phone number</span>
            <input value={phone} onChange={e => setPhone(e.target.value)} />
          </label>
          <label>
            <span>Date of birth</span>
            <input type="date" value={dob} onChange={e => setDob(e.target.value)} />
          </label>
        </div>
        <label>
          <span>Avatar (optional)</span>
          <input type="file" accept="image/*" onChange={e => setAvatar(e.target.files?.[0] || null)} />
        </label>
        {error && <div className="error" role="alert">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
      </form>
    </div>
  )
}
