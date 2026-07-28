import React from 'react'
import { useState,useEffect } from 'react';
import API_BASE from '../../config';
const RecentMeetings = () => {
  const [meetings,setMeetings]=useState([]);
  useEffect(()=>{
    fetch(`${API_BASE}/api/meetings/recent`,{
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
    <div className="bg-gray-950 px-6 py-12 border-t border-gray-800">
      <h3 className="mb-8 text-center text-2xl font-bold text-white tracking-wide">Recent Meetings</h3>
      <div className="flex flex-col gap-4 max-w-4xl mx-auto">

        {meetings.map((meeting)=>(
          <div  key={meeting.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border border-gray-800 bg-gray-900 px-6 py-5 hover:border-gray-700 transition-colors shadow-lg">
          <div>
            <p className="font-semibold text-gray-200 text-lg">{meeting.title||"Untitled Meeting"}</p>
            <p className="text-sm text-gray-500 mt-1">{new Date(meeting.createdAt).toLocaleString()}</p>
          </div>
          <button onClick={()=>{window.location.href=`/meeting/${meeting.roomCode}`}} className="mt-4 sm:mt-0 cursor-pointer rounded-lg border border-gray-700 bg-gray-800 px-5 py-2 text-[#00FFFF] font-semibold hover:bg-gray-700 hover:text-white transition-colors active:scale-95">Rejoin</button>
        </div>
        ))}

        

      </div>
    </div>
  )
}

export default RecentMeetings