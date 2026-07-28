import React, { useState } from 'react'
import API_BASE from '../config'

const Register = () => {
    const [email,setEmail]=useState('');
      const [password,setPassword]=useState('');
      const [name, setName] = useState('');
      const [error, setError] = useState(null)
    
      function handleGoogleLogin() {
        window.location.href = `${API_BASE}/auth/google`;
      }
      
      async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
    
        try{
          const res=await fetch(`${API_BASE}/api/auth/register`,{
            method:"POST",
            headers:{'Content-Type':'application/json' },
            credentials:'include',
            body: JSON.stringify({name,email,password})
          })
          const data=await res.json();
          if(!data.success){
            setError(data.message);
            return;
          }
          window.location.href='/home';
    
        }catch(err){
          setError('Something went wrong. Please try again.')
        }
      }
    
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
            <h1 className="mb-6 text-center text-3xl font-bold text-white">Lets Hangout!</h1>
            <button
              className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 font-semibold text-gray-300 hover:bg-gray-700 hover:text-[#ff0] hover:border-[#ff0]/50 active:bg-gray-600 transition-all duration-300"
              onClick={handleGoogleLogin}
            >
              {/* <span className="text-xl"><G></span></span> */}
              Continue with Google
            </button>
    
            <div className="my-6 flex items-center gap-4">
              <hr className="flex-1 border-gray-800" />
              <span className="text-sm text-gray-500">or</span>
              <hr className="flex-1 border-gray-800" />
            </div>
    
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                type="text"
                placeholder="Name"
                required
                value={name}
                onChange={(e)=>setName(e.target.value)}
                className="rounded-lg border border-gray-700 bg-gray-800 text-white px-4 py-3 outline-none focus:border-[#ff0] focus:ring-1 focus:ring-[#ff0] placeholder-gray-500 transition-all"
              />
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                className="rounded-lg border border-gray-700 bg-gray-800 text-white px-4 py-3 outline-none focus:border-[#ff0] focus:ring-1 focus:ring-[#ff0] placeholder-gray-500 transition-all"
              />
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                className="rounded-lg border border-gray-700 bg-gray-800 text-white px-4 py-3 outline-none focus:border-[#ff0] focus:ring-1 focus:ring-[#ff0] placeholder-gray-500 transition-all"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                className="mt-2 cursor-pointer rounded-lg border border-[#ff0] bg-transparent px-4 py-3 font-bold text-[#ff0] hover:bg-[#ff0] hover:text-black active:scale-95 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,0,0.1)] hover:shadow-[0_0_20px_rgba(255,255,0,0.4)]"
              >
                Register
              </button>
            </form>
    
            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <a href="/login" className="font-semibold text-[#ff0] hover:text-white transition-colors">Log In</a>
            </p>
          </div>
        </div>
      );
}

export default Register