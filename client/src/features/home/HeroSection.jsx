import { useNavigate } from 'react-router-dom';
import API_BASE from '../../config';

function Herosection() {
    const navigate = useNavigate();

    async function handleStart() {
        if (window.location.pathname === '/') {
            navigate('/home');
            return;
        }
        
        try {
            const res = await fetch(`${API_BASE}/api/meetings/instant`, {
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
        } catch(err) {
            console.error(err);
        }
    }

    async function handleJoin() {
        if (window.location.pathname === '/') {
            navigate('/home');
            return;
        }

        const code = prompt("Enter the meeting room code:");
        if(!code){
            return
        }
        try {
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
        } catch(err) {
            console.error(err);
        }
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 py-24 px-6 text-center border-b border-gray-800">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Video Calls Made <span className="text-[#00FFFF]">Simple</span></h2>
            <p className="mt-6 text-lg text-gray-400 max-w-2xl">Connect with anyone, anywhere. Start or join a meeting in seconds with our highly optimized peer-to-peer network.</p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <button 
                    onClick={handleStart}
                    className="cursor-pointer rounded-lg border border-[#00FFFF] bg-transparent px-8 py-3 font-bold text-[#00FFFF] hover:bg-[#00FFFF] hover:text-black shadow-[0_0_15px_rgba(0,255,255,0.1)] hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all">
                    Start a Meeting
                </button>
                <button 
                    onClick={handleJoin}
                    className="cursor-pointer rounded-lg border border-gray-700 bg-gray-800 px-8 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-all">
                    Join a Meeting
                </button>
            </div>
        </div>
    )
}
export default Herosection;