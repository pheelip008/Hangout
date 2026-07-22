import React from 'react'
import Herosection from '../features/home/HeroSection'
import MeetingAction from '../features/home/MeetingActions'
import RecentMeetings from '../features/home/RecentMeetings'
import Scheduledmeetings from '../features/home/Scheduledmeetings'

function Home(){
    return(
        <>
        <Herosection/>
        <MeetingAction/>
        <Scheduledmeetings/>
        <RecentMeetings/>
        
        </>
    )
}
export default Home;