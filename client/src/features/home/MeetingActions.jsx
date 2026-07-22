import { useState } from 'react';
function MeetingAction() {
    async function newmeet(){
        const res=await fetch('http://localhost:3000/api/meetings/instant',{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
            },
            credentials:'include',
        })
        const data=await res.json();
        if(!data.success){
            alert(data.message);
            return;
        }
        window.location.href="/meeting/" + data.meeting.roomCode;
    }
    async function handlejoin(){
        const code = prompt("Enter the meeting room code:");
        if(!code){
            return
        }
        const res=await fetch("http://localhost:3000/api/meetings/join",{
            method:"POST",
            credentials:"include",
            headers:{
                "Content-Type":"application/json",
            },
            body: JSON.stringify({roomCode:code})
        })
        const data=await res.json();
        if(!data.success){
            alert(data.message);
            return;
        }
        window.location.href="/meeting/" + data.meeting.roomCode;
    }



    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [title, setTitle] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');
    async function handleschedule(){
        const res=await fetch("http://localhost:3000/api/meetings/schedule",{
            method:"POST",
            credentials:"include",
            headers:{
                "Content-Type":"application/json",
            },
            body: JSON.stringify({title,scheduledAt})
        })
        const data=await res.json();
        if(!data.success){
            alert(data.message);
            return;
        }
        alert("Meeting scheduled successfully")
        setShowScheduleForm(false);
        setTitle('');
        setScheduledAt('');
        
    }


    return (
        <div className="border-5 border-black bg-white px-6 py-10">
            <h3 className="mb-6 text-center text-2xl font-bold text-gray-900">Quick Actions</h3>
            <div className="flex items-center justify-center gap-6">
                <div onClick={newmeet} className="flex h-40 w-60 cursor-pointer flex-col items-center justify-center rounded-lg border-5 border-dashed border-black bg-gray-200 hover:bg-gray-300">
                    <span className="text-3xl">📹</span>
                    <span className="mt-2 font-semibold">New Meeting</span>
                </div>
                <div onClick={()=>setShowScheduleForm(true) }  className="flex h-40 w-60 cursor-pointer flex-col items-center justify-center rounded-lg border-5 border-dashed border-black bg-gray-200 hover:bg-gray-300">
                    <span className="text-3xl">📅</span>
                    <span className="mt-2 font-semibold">Schedule</span>
                </div>
                <div onClick={handlejoin} className="flex h-40 w-60 cursor-pointer flex-col items-center justify-center rounded-lg border-5 border-dashed border-black bg-gray-200 hover:bg-gray-300">
                    <span className="text-3xl">🔗</span>
                    <span className="mt-2 font-semibold">Join with Code</span>
                </div>
            </div>
            {showScheduleForm && (
                <div className="mt-5 flex gap-14 cursor-pointer items-center justify-center   rounded-lg border-5 border-dashed border-black bg-gray-200" >
                    <input className="mb-2 mt-2 h-10 w-60 border-2 border-black px-4 py-3 outline-none focus:border-blue-900" type="text"
                    placeholder='Meeting title'
                    value={title}
                    onChange={(e)=>setTitle(e.target.value)}
                    />
                    <input className="mb-2 mt-2 h-10 w-60 border-2 border-black px-4 py-3 outline-none focus:border-blue-900" type="datetime-local"
                    value={scheduledAt}
                    onChange={(e)=>setScheduledAt(e.target.value)}
                    
                    />
                    <button className="mb-2 mt-2 cursor-pointer rounded-lg border-2 font-bold border-black bg-blue-900 px-2 py-2 text-white hover:bg-blue-800 active:bg-blue-950" onClick={handleschedule}>Confirm Schedule</button>
                    
                </div>
            )}
        </div>
    )
}
export default MeetingAction;