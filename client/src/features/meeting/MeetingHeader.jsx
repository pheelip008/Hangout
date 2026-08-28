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
        <header className="ex-meeting-header">
            <img src="/images/hero/navbar-bar.svg" className="ex-meeting-header-bg" alt="" />
            <img src="/images/meetroom/logo.svg" alt="Hangout Logo" className="h-16 z-10" />
            
            <div className="flex items-center gap-6 z-10">
                <div className="ex-navbar-pill-wrapper flex items-center justify-center">
                    <img src="/images/hero/btn-gray.svg" className="ex-navbar-pill-svg" alt="" />
                    <span className="ex-navbar-pill-text text-black">{timeString}</span>
                </div>

                <div className="ex-control-btn-wrapper" onClick={togglePanel}>
                    <img src="/images/hero/btn-dark.svg" className="ex-control-btn-svg" alt="" />
                    <button className="ex-control-btn text-white">
                        👥 Participants
                    </button>
                </div>
            </div>
        </header>
    );
}
export default MeetingHeader;
