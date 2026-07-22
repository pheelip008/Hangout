import React from 'react'
import { useState,useEffect } from 'react';
const Scheduledmeetings = () => {
  const [meetings,setMeetings]=useState([]);
  useEffect(()=>{
    fetch('http://localhost:3000/api/meetings/scheduled',{
      method:"GET",
      credentials:'include',
      headers:{
        "Content-Type":"application/json",
      }
    }).then(res=>res.json())
    .then(data=>{
        console.log(data);
        if(data.success){
           setMeetings(data.meetings);
        }
    })
  },[])
  return (
    <div className="border-5 border-black bg-gray-50 px-6 py-10">
      <h3 className="mb-6 text-center text-2xl font-bold text-gray-900">Scheduled Meetings</h3>
      <div className="flex flex-col gap-4">

        {meetings.map((meeting)=>(
          <div  key={meeting.id} className="flex items-center justify-between rounded-lg border-2 border-black bg-white px-6 py-4">
          <div>
            <p className="font-semibold text-gray-900">{meeting.title||"Untitled Meeting"}</p>
            <p className="text-sm text-gray-500">{"Scheduled for "+new Date(meeting.scheduledAt).toLocaleString()}</p>
          </div>
          <button onClick={()=>{window.location.href=`/meeting/${meeting.roomCode}`}} className="cursor-pointer rounded-lg border-2 border-blue-900 bg-blue-900 px-4 py-2 text-white hover:bg-blue-800">Join</button>
        </div>
        ))}

        

      </div>
    </div>
  )
}

export default Scheduledmeetings