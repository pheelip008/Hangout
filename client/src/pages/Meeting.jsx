import React from 'react'
import '../pagescss/Meeting.css'
import MeetingLayout from '../layouts/MeetingLayout'

function Meeting(){
    return(
        <>

        <div className="flex items-center justify-center text-2xl font-semibold ">
            Meeting page
        </div>
        <MeetingLayout/>
        </>
    )
}
export default Meeting;