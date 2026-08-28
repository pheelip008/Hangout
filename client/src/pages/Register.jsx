import React, { useState } from 'react'
import API_BASE from '../config'
import '../pagescss/Login.css'

// SVG paths (served from public/)
const BG_SVG       = '/images/loginandregister/bg.svg'
const CARD_SVG     = '/images/loginandregister/maincard.svg'
const NAME_SVG     = '/images/loginandregister/namaplace.svg'
const EMAIL_SVG    = '/images/loginandregister/emailcardtoypeemail.svg'
const PASSWORD_SVG = '/images/loginandregister/passwordplace.svg'
const BUTTON_SVG   = '/images/loginandregister/buttons.svg'
const LOGO_SVG     = '/images/meetroom/logo.svg'

const Register = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(null)

  function handleGoogleLogin() {
    window.location.href = `${API_BASE}/auth/google`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.message)
        return
      }
      window.location.href = '/home'
    } catch (err) {
      setError('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="login-page">
      {/* Background hand-drawn shape */}
      <img src={BG_SVG} alt="" className="login-bg" draggable={false} />

      {/* Logo + Card column */}
      <div className="login-content">
        {/* Hangout logo — outside and above the card */}
        <img src={LOGO_SVG} alt="Hangout" className="login-logo" draggable={false} />

        {/* Card */}
        <div className="login-card">
          {/* Card background SVG */}
          <img src={CARD_SVG} alt="" className="login-card-bg" draggable={false} />

          <h1 className="login-title">Let's Hangout!</h1>

          {/* Google login button */}
          <div className="login-btn-wrapper login-google-wrapper">
            <img src={BUTTON_SVG} alt="" className="login-btn-svg" draggable={false} />
            <button type="button" className="login-btn" onClick={handleGoogleLogin}>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="login-divider">
            <span className="login-divider-line" />
            <span className="login-divider-text">or</span>
            <span className="login-divider-line" />
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {/* Name field */}
            <div className="login-input-wrapper">
              <img src={NAME_SVG} alt="" className="login-input-svg" draggable={false} />
              <input
                type="text"
                placeholder="Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="login-input"
              />
            </div>

            {/* Email field */}
            <div className="login-input-wrapper">
              <img src={EMAIL_SVG} alt="" className="login-input-svg" draggable={false} />
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
              />
            </div>

            {/* Password field */}
            <div className="login-input-wrapper">
              <img src={PASSWORD_SVG} alt="" className="login-input-svg" draggable={false} />
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            {/* Submit button */}
            <div className="login-btn-wrapper login-submit-wrapper">
              <img src={BUTTON_SVG} alt="" className="login-btn-svg" draggable={false} />
              <button type="submit" className="login-btn">
                Register
              </button>
            </div>
          </form>

          <p className="login-footer">
            Already have an account?{' '}
            <a href="/login">Log In</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register