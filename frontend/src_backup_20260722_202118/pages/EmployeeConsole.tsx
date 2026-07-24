import { useAuth } from '../auth/AuthContext'

export default function EmployeeConsolePage() {
  const { user } = useAuth()
  return (
    <div className="container" style={{ maxWidth: 960 }}>
      <h1>Employee Console</h1>
      <p>Welcome{user?.first_name ? `, ${user.first_name}` : ''}. Manage daily operations for your theater(s).</p>
      <div className="card" style={{ padding: 16, marginTop: 12 }}>
        <p>This area can include today's showtimes, seat tools, and quick actions. (Coming soon)</p>
      </div>
    </div>
  )
}
