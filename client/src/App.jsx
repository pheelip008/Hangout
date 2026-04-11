import { useState } from 'react'
import AppRoutes from './routes/AppRoutes'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      
      <div>
        <h1>Hangout!</h1>
      </div>
      <AppRoutes/>
    </>
  )
}

export default App
