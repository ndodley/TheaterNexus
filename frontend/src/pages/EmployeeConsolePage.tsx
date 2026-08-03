import { useAuth } from '../auth/AuthContext'
import './EmployeeConsolePage.css'

export default function EmployeeConsolePage() {
  const { user } = useAuth()
  return (
    <div className="container employeeConsole-page">
      <h1>Employee Console</h1>
      <p>Welcome{user?.first_name ? `, ${user.first_name}` : ''}. Manage daily operations for your theater(s).</p>
      <div className="card employeeConsole-card">
        <p>This area can include today's showtimes, seat tools, and quick actions. (Coming soon)</p>
      </div>
    </div>
  )
}
