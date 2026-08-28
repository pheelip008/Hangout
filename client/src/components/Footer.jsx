import React from 'react'
import logo from './logo.png'

const NAVBAR_BAR = '/images/hero/navbar-bar.svg'

const Footer = () => {
  return (
    <footer className="ex-footer">
      <img src={NAVBAR_BAR} alt="" className="ex-footer-bg" draggable={false} />
      <a href="https://pheelip-portfolio.vercel.app/" target="_blank" rel="noopener noreferrer">
        <img src={logo} alt="Hangout" className="ex-footer-logo" draggable={false} />
      </a>
      <a href="mailto:pheelipraipure@gmail.com" className="ex-footer-link">
        pheelipraipure@gmail.com
      </a>
    </footer>
  )
}

export default Footer