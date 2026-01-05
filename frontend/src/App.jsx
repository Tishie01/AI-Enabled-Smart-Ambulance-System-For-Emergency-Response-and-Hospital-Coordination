import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import HospitalFinder from './components/HospitalFinder'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                <path d="M19 8H18V5C18 3.34 16.66 2 15 2H9C7.34 2 6 3.34 6 5V8H5C3.34 8 2 9.34 2 11V19C2 20.66 3.34 22 5 22H19C20.66 22 22 20.66 22 19V11C22 9.34 20.66 8 19 8ZM8 5C8 4.45 8.45 4 9 4H15C15.55 4 16 4.45 16 5V8H8V5ZM20 19C20 19.55 19.55 20 19 20H5C4.45 20 4 19.55 4 19V11C4 10.45 4.45 10 5 10H19C19.55 10 20 10.45 20 11V19Z" fill="currentColor"/>
                <path d="M12 12.5C11.17 12.5 10.5 13.17 10.5 14C10.5 14.83 11.17 15.5 12 15.5C12.83 15.5 13.5 14.83 13.5 14C13.5 13.17 12.83 12.5 12 12.5ZM13 17H11V15H13V17ZM15 13H9V11H15V13Z" fill="currentColor"/>
              </svg>
              Emergency System
            </Link>
            <div className="nav-links">
              <Link to="/" className="nav-link">Dashboard</Link>
              <Link to="/find-hospital" className="nav-link">Find Hospital</Link>
            </div>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/find-hospital" element={<HospitalFinder />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

