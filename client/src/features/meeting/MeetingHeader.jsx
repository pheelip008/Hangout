import { useState, useEffect } from 'react';

function MeetingHeader({ togglePanel, startedAt }) {
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        if (!startedAt) return;
        const startTime = new Date(startedAt).getTime();
        
        const timer = setInterval(() => {
            const now = new Date().getTime();
            setDuration(Math.floor((now - startTime) / 1000));
        }, 1000);
        
        return () => clearInterval(timer);
    }, [startedAt]);

    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const timeString = startedAt ? formatDuration(duration) : "Waiting...";

    return (
        <header className="flex justify-between items-center p-4 bg-gray-950 border-b border-gray-800 shadow-md">
            <div className="text-2xl font-bold text-[#00FFFF] tracking-wider">Hangout!</div>
            
            <div className="flex items-center gap-6">
                <span className="text-lg font-mono text-[#2a2c3a] tracking-widest bg-gray-900 px-3 py-1 rounded-md border border-gray-800">{timeString}</span>

                <button 
                    onClick={togglePanel}
                    className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm border border-gray-700 cursor-pointer font-bold transition-all text-white hover:text-[#00FFFF]"
                >
                    👥 Participants
                </button>
            </div>
        </header>
    );
}
export default MeetingHeader;
