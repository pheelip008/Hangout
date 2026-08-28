import React from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API_BASE from '../config'
import '../pagescss/Home.css'

const NAVBAR_BAR = '/images/hero/navbar-bar.svg'
const LOGO_SVG   = '/images/meetroom/logo.svg'
const PILL_WHITE = '/images/loginandregister/buttons.svg'

const Navbar = ({ children }) => {
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setUser(data.success ? data.user : null))
      .catch(() => setUser(null))
  }, [])

  async function handlelogout() {
    const res = await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
    const data = await res.json()
    window.location.href = '/login'
  }

  return (
    <nav className="ex-navbar">
      <img src={NAVBAR_BAR} alt="" className="ex-navbar-bg" draggable={false} />
      <img src={LOGO_SVG} alt="Hangout" className="ex-navbar-logo" draggable={false} />

      <div className="ex-navbar-right">
        {children}

        {user && (
          <>
            <div className="ex-navbar-pill">
              <img src={PILL_WHITE} alt="" className="ex-navbar-pill-svg" draggable={false} />
              <span className="ex-navbar-pill-text">{user?.name}</span>
            </div>
            <div className="ex-navbar-pill">
              <img src={PILL_WHITE} alt="" className="ex-navbar-pill-svg" draggable={false} />
              <button className="ex-navbar-pill-btn" onClick={handlelogout}>log out</button>
            </div>
          </>
        )}

        {!user && (
          <>
            <Link to="/login" className="ex-navbar-pill" style={{ textDecoration: 'none' }}>
              <img src={PILL_WHITE} alt="" className="ex-navbar-pill-svg" draggable={false} />
              <span className="ex-navbar-pill-btn">Login</span>
            </Link>
            <Link to="/register" className="ex-navbar-pill" style={{ textDecoration: 'none' }}>
              <img src={PILL_WHITE} alt="" className="ex-navbar-pill-svg" draggable={false} />
              <span className="ex-navbar-pill-btn">Register</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar