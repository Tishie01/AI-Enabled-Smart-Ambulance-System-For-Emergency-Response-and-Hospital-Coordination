import React from 'react'
import AmbulanceLogin from './components/AmbulanceLogin'
import AmbulanceDashboard from './components/AmbulanceDashboard'
import GuardianView from './components/GuardianView'

export default function App(){
  const [ambulanceId, setAmbulanceId] = React.useState(null)
  const [token, setToken] = React.useState(null)

  // Check for existing session
  React.useEffect(() => {
    const storedToken = localStorage.getItem('ambulanceToken')
    const storedId = localStorage.getItem('ambulanceId')
    if (storedToken && storedId) {
      setToken(storedToken)
      setAmbulanceId(storedId)
    }
  }, [])

  // Check if this is a guardian view (either /guardian path or ?sessionId query param)
  const path = window.location.pathname
  const searchParams = new URLSearchParams(window.location.search)
  const isGuardianView = path.includes('/guardian') || searchParams.has('sessionId')

  function handleLogin(id, tok) {
    setAmbulanceId(id)
    setToken(tok)
  }

  function handleLogout() {
    localStorage.removeItem('ambulanceToken')
    localStorage.removeItem('ambulanceId')
    setAmbulanceId(null)
    setToken(null)
  }

  // Guardian view for public access
  if (isGuardianView) {
    return <GuardianView />
  }

  // Ambulance login required
  if (!ambulanceId || !token) {
    return <AmbulanceLogin onLogin={handleLogin} />
  }

  // Ambulance dashboard
  return <AmbulanceDashboard ambulanceId={ambulanceId} onLogout={handleLogout} />
}
