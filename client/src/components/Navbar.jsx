import React from 'react'

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between border-5 border-black bg-blue-900 px-6 py-4">
      <h1 className="text-xl font-bold text-white">Hangout!</h1>
      <ul className="flex gap-6 text-white">
        <li className="cursor-pointer hover:text-gray-300">Home</li>
        <li className="cursor-pointer hover:text-gray-300">About</li>
        <li className="cursor-pointer hover:text-gray-300">Contact</li>
      </ul>
      <div className="flex gap-3">
        <button className="cursor-pointer rounded-lg border-2 border-white bg-transparent px-4 py-2 text-white hover:bg-white hover:text-blue-900">Login</button>
        <button className="cursor-pointer rounded-lg border-2 border-white bg-white px-4 py-2 text-blue-900 hover:bg-gray-200">Sign Up</button>
      </div>
    </nav>
  )
}

export default Navbar