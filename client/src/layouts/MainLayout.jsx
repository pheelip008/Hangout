import React from 'react'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import {Outlet} from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
    <Navbar/>
    <div className="flex-1 flex flex-col">
      <Outlet/>
    </div>
    <Footer/>
    </div>
  )
}

export default MainLayout