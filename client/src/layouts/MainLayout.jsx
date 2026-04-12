import React from 'react'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import Herosection from '../features/home/HeroSection';
import MeetingAction from '../features/home/MeetingActions';
import RecentMeetings from '../features/home/RecentMeetings';
const MainLayout = () => {
  return (
    <>
    <Navbar/>
    {/* content */}
    <Herosection/>
    <MeetingAction/>
    <RecentMeetings/>
    <Footer/>
    </>
  )
}

export default MainLayout