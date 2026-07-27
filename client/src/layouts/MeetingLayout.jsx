import { useState } from "react";
import MeetingHeader from "../features/meeting/MeetingHeader";
import ParticipantPanel from "../features/meeting/ParticipantPanel"
import ControlBar from "../features/meeting/ControlBar"
import VideoGrid from "../features/meeting/VideoGrid";

function MeetingLayout(props) {
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    return(
        <div className="flex flex-col h-full w-full bg-gray-900 text-white">
            <MeetingHeader 
                togglePanel={() => setIsPanelOpen(!isPanelOpen)} 
            />
            
            <div className="flex flex-1 overflow-hidden p-4 gap-4">

                <main className="flex-1 flex flex-col min-w-0">
                    <VideoGrid {...props} />
                </main>
                {isPanelOpen && (
                    <aside className="w-80 flex flex-col border-l border-gray-700 pl-4 overflow-y-auto">
                        <ParticipantPanel/>
                    </aside>
                )}
            </div>
            <ControlBar
                isScreenSharing={props.isLocalScreenSharing} 
                onStartScreenShare={props.onStartScreenShare} 
                onStopScreenShare={props.onStopScreenShare}
            />
        </div>
    )
}
export default MeetingLayout;
