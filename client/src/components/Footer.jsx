import React from 'react'
import logo from './logo.png'

const Footer = () => {
  return (
    <div>
      <div className='w-full h-20 border-5 text-amber-50 border-black bg-gray-900 flex items-center justify-between px-8'>
        <div className='flex items-center'>
          <img src={logo} alt="Logo" className="h-12 w-auto" />
        </div>
        <div>
          <a href="mailto:pheelipraipure@gmail.com" className="hover:text-gray-300 transition-colors">
            pheelipraipure@gmail.com
          </a>
        </div>
      </div>
    </div>
  )
}

export default Footer