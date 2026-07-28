import { useState } from 'react';
import API_BASE from '../../config';
function MeetingAction() {
    async function newmeet(){
        const res=await fetch(`${API_BASE}/api/meetings/instant`,{
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
        const res=await fetch(`${API_BASE}/api/meetings/join`,{
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
        const res=await fetch(`${API_BASE}/api/meetings/schedule`,{
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
        <div className="bg-gray-900 px-6 py-16">
            <h3 className="mb-10 text-center text-2xl font-bold text-white tracking-wide">Quick Actions</h3>
            <div className="flex flex-wrap items-center justify-center gap-6">
                <div onClick={newmeet} className="group flex h-40 w-60 cursor-pointer flex-col items-center justify-center rounded-2xl border border-gray-800 bg-gray-950 hover:border-[#00FFFF]/50 hover:shadow-[0_0_15px_rgba(0,255,255,0.1)] transition-all">
                    <span className="text-4xl group-hover:scale-110 transition-transform">📹</span>
                    <span className="mt-4 font-semibold text-gray-400 group-hover:text-white transition-colors">New Meeting</span>
                </div>
                <div onClick={()=>setShowScheduleForm(true) }  className="group flex h-40 w-60 cursor-pointer flex-col items-center justify-center rounded-2xl border border-gray-800 bg-gray-950 hover:border-[#ff0]/50 hover:shadow-[0_0_15px_rgba(255,255,0,0.1)] transition-all">
                    <span className="text-4xl group-hover:scale-110 transition-transform">📅</span>
                    <span className="mt-4 font-semibold text-gray-400 group-hover:text-white transition-colors">Schedule</span>
                </div>
                <div onClick={handlejoin} className="group flex h-40 w-60 cursor-pointer flex-col items-center justify-center rounded-2xl border border-gray-800 bg-gray-950 hover:border-[#00FFFF]/50 hover:shadow-[0_0_15px_rgba(0,255,255,0.1)] transition-all">
                    <span className="text-4xl group-hover:scale-110 transition-transform">🔗</span>
                    <span className="mt-4 font-semibold text-gray-400 group-hover:text-white transition-colors">Join with Code</span>
                </div>
            </div>
            {showScheduleForm && (
                <div className="mt-10 flex flex-wrap gap-4 items-center justify-center rounded-2xl border border-gray-800 bg-gray-950 p-6 shadow-2xl max-w-4xl mx-auto" >
                    <input className="h-12 w-64 rounded-lg border border-gray-700 bg-gray-900 text-white px-4 outline-none focus:border-[#ff0] focus:ring-1 focus:ring-[#ff0] placeholder-gray-500 transition-all" type="text"
                    placeholder='Meeting title'
                    value={title}
                    onChange={(e)=>setTitle(e.target.value)}
                    />
                    <input className="h-12 w-64 rounded-lg border border-gray-700 bg-gray-900 text-white px-4 outline-none focus:border-[#ff0] focus:ring-1 focus:ring-[#ff0] placeholder-gray-500 transition-all" type="datetime-local"
                    value={scheduledAt}
                    onChange={(e)=>setScheduledAt(e.target.value)}
                    style={{colorScheme: 'dark'}}
                    />
                    <button className="h-12 cursor-pointer rounded-lg border border-[#ff0] bg-transparent px-6 font-bold text-[#ff0] hover:bg-[#ff0] hover:text-black active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,0,0.1)] hover:shadow-[0_0_20px_rgba(255,255,0,0.4)]" onClick={handleschedule}>Confirm Schedule</button>
                    
                </div>
            )}
        </div>
    )
}
export default MeetingAction;