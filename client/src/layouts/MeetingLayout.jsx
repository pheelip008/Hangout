import { useState, useEffect, useRef } from "react";
import MeetingHeader from "../features/meeting/MeetingHeader";
import ParticipantPanel from "../features/meeting/ParticipantPanel"
import ControlBar from "../features/meeting/ControlBar"
import VideoGrid from "../features/meeting/VideoGrid";
import PlaygroundView from "../features/meeting/PlaygroundView";

function MeetingLayout(props) {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isPlaygroundActive, setIsPlaygroundActive] = useState(false);
    const remoteVideoRefs = useRef({});

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key.toLowerCase() === 'p' && isPlaygroundActive) {
                setIsPlaygroundActive(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaygroundActive]);

    useEffect(() => {
        if (isPlaygroundActive) {
            if (props.localVideoRef?.current) props.localVideoRef.current.pause();
            Object.values(remoteVideoRefs.current).forEach(ref => {
                if (ref) ref.pause();
            });
        } else {
            if (props.localVideoRef?.current) props.localVideoRef.current.play().catch(e => console.warn("Failed to play local video", e));
            Object.values(remoteVideoRefs.current).forEach(ref => {
                if (ref) ref.play().catch(e => console.warn("Failed to play remote video", e));
            });
        }
    }, [isPlaygroundActive, props.localVideoRef, props.participants]);

    return(
        <div className="flex flex-col h-full w-full bg-gray-900 text-white">
            <MeetingHeader 
                togglePanel={() => setIsPanelOpen(!isPanelOpen)} 
                startedAt={props.startedAt}
            />
            
            <div className="flex flex-1 overflow-hidden p-4 gap-4 relative">
                <main className={`flex-1 flex flex-col min-w-0 ${isPlaygroundActive ? 'hidden' : 'flex'}`}>
                    <VideoGrid {...props} remoteVideoRefs={remoteVideoRefs} />
                </main>

                {isPlaygroundActive && (
                    <main className="flex-1 flex flex-col min-w-0 relative">
                        <PlaygroundView 
                            roomCode={props.roomCode}
                            socketRef={props.socketRef}
                            localScreenStreamRef={props.localScreenStreamRef}
                            remoteScreenRef={props.remoteScreenRef}
                            isLocalScreenSharing={props.isLocalScreenSharing}
                            isRemoteScreenSharing={props.isRemoteScreenSharing}
                            playerName={props.localName}
                            localVideoRef={props.localVideoRef}
                            participants={props.participants}
                        />
                    </main>
                )}
                {isPanelOpen && (
                    <aside className="w-80 flex flex-col border-l border-gray-700 overflow-y-auto">
                        <ParticipantPanel
                            localName={props.localName}
                            participants={props.participants || {}}
                        />
                    </aside>
                )}
            </div>
            {!isPlaygroundActive && (
                <ControlBar
                    roomCode={props.roomCode}
                    isScreenSharing={props.isLocalScreenSharing} 
                    onStartScreenShare={props.onStartScreenShare} 
                    onStopScreenShare={props.onStopScreenShare}
                    isAudioMuted={props.isAudioMuted}
                    isVideoMuted={props.isVideoMuted}
                    onToggleAudio={props.onToggleAudio}
                    onToggleVideo={props.onToggleVideo}
                    onLeaveMeeting={props.onLeaveMeeting}
                    onTogglePlayground={() => setIsPlaygroundActive(true)}
                />
            )}
        </div>
    )
}
export default MeetingLayout;
