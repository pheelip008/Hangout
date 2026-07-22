import React from 'react'
import {useEffect,useState} from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({children}) => {
  const [user, setUser] = useState(null);

  useEffect(()=>{
    fetch('http://localhost:3000/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setUser(data.success ? data.user : null);
        
      })
      .catch(() => {
        setUser(null);
        
      });
  },[]);

  async function handlelogout(){
    const res=await fetch('http://localhost:3000/api/auth/logout',{
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
    <nav className="flex items-center justify-between border-5 border-black bg-blue-900 px-6 py-4">
      <h1 className="text-xl font-bold text-white">Hangout!</h1>
      <div className="flex gap-6">
        {children}
      </div>
      {
        user&&<div className="flex gap-3">
        <div className='rounded-lg border-2 border-white bg-white px-4 py-2 text-blue-900'>{user?.name}</div>
        <button className="cursor-pointer rounded-lg border-2 border-white bg-white px-4 py-2 text-blue-900 hover:bg-gray-200"
        onClick={handlelogout}
        >Log out</button>
      </div>
      }
      {
        !user && 
        <div className="flex gap-3">
        <button className='rounded-lg border-2 border-white bg-white px-4 py-2 text-blue-900 hover:bg-gray-200'>
          <Link to="/login">Login</Link>
          </button>
        <button className='rounded-lg border-2 border-white bg-white px-4 py-2 text-blue-900 hover:bg-gray-200'>
          <Link to="/register">Register</Link>
        </button>
      </div>
      }
    </nav>
    
  )
}

export default Navbar