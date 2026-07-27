import { useState, useEffect } from 'react';

function MeetingHeader({ togglePanel }) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <header className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700">
            <div className="text-xl font-bold">Meeting</div>
            
            <div className="flex items-center gap-4">
                <span className="text-lg font-mono">{timeString}</span>

                <button 
                    onClick={togglePanel}
                    className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm border border-gray-500 cursor-pointer font-bold transition-colors"
                >
                    👥 Participants
                </button>
            </div>
        </header>
    );
}
export default MeetingHeader;
