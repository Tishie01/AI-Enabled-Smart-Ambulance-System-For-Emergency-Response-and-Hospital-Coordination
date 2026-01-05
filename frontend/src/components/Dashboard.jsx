import { useState, useEffect } from 'react'
import './Dashboard.css'

function Dashboard() {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // WebSocket connection will be implemented here
    setConnected(true)
  }, [])

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Emergency Data Relay System</h1>
        <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </header>
      <main className="dashboard-content">
        <div className="dashboard-section">
          <h2>Hospital Dashboard</h2>
          <p>Dashboard components will be added here</p>
        </div>
      </main>
    </div>
  )
}

export default Dashboard

