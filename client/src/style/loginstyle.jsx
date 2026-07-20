import React from 'react'
import { useState } from 'react'


const loginstyle = () => {
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [error, setError] = useState(null)

  function handleGoogleLogin() {
    window.location.href = 'http://localhost:3000/auth/google';
  }
  
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    try{
      const res=await fetch('http://localhost:3000/api/auth/login',{
        method:"POST",
        headers:{'Content-Type':'application/json' },
        credentials:'include',
        body: JSON.stringify({email,password})
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
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg border-5 border-black bg-white p-8">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-900">Log in to Hangout</h1>

        <button
          className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border-2 border-black bg-white px-4 py-3 font-semibold text-gray-800 hover:bg-gray-100 active:bg-gray-200"
          onClick={handleGoogleLogin}
        >
          {/* <span className="text-xl"><G></span></span> */}
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-4">
          <hr className="flex-1 border-gray-300" />
          <span className="text-sm text-gray-500">or</span>
          <hr className="flex-1 border-gray-300" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="rounded-lg border-2 border-black px-4 py-3 outline-none focus:border-blue-900"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="rounded-lg border-2 border-black px-4 py-3 outline-none focus:border-blue-900"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            className="cursor-pointer rounded-lg border-2 border-blue-900 bg-blue-900 px-4 py-3 font-semibold text-white hover:bg-blue-800 active:bg-blue-950"
          >
            Log In
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/register" className="font-semibold text-blue-900 hover:underline">Sign up</a>
        </p>
      </div>
    </div>
  );
}

export default loginstyle