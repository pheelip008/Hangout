import React from 'react'
import {useEffect,useState} from 'react';
import { Link } from 'react-router-dom';
import API_BASE from '../config';

const Navbar = ({children}) => {
  const [user, setUser] = useState(null);

  useEffect(()=>{
    fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setUser(data.success ? data.user : null);
        
      })
      .catch(() => {
        setUser(null);
        
      });
  },[]);

  async function handlelogout(){
    const res=await fetch(`${API_BASE}/api/auth/logout`,{
          method:"POST",
          headers:{'Content-Type':'application/json' },
          credentials:'include',
        
    })
    const data =await res.json();
    if(data.success){
      window.location.href='/login';

    }
    else{
      window.location.href='/login'
    }
  }
  return (
    <nav className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-6 py-4 shadow-md">
      <h1 className="text-2xl font-bold text-[#00FFFF] tracking-wider">Hangout!</h1>
      <div className="flex gap-6">
        {children}
      </div>
      {
        user&&<div className="flex gap-3">
        <div className='rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-300'>{user?.name}</div>
        <button className="cursor-pointer rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white hover:bg-gray-700 hover:text-[#ff0] hover:border-[#ff0]/50 transition-all"
        onClick={handlelogout}
        >Log out</button>
      </div>
      }
      {
        !user && 
        <div className="flex gap-3">
        <button className='rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white hover:bg-gray-700 hover:text-[#00FFFF] transition-all'>
          <Link to="/login">Login</Link>
          </button>
        <button className='rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white hover:bg-gray-700 hover:text-[#ff0] transition-all'>
          <Link to="/register">Register</Link>
        </button>
      </div>
      }
    </nav>
    
  )
}

export default Navbar