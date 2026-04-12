import MeetingHeader from "../features/meeting/MeetingHeader";
import VideoGrid from "../features/meeting/VideoGrid";
import ParticipantPanel from "../features/meeting/ParticipantPanel"
import ControlBar from "../features/meeting/ControlBar"
function MeetingLayout(){
    return(
        <>
        <MeetingHeader/>
        <div className="flex border-5 border-black">
            <main className="flex-1">
                <VideoGrid/>
            </main>
            <ParticipantPanel/>
        </div>
        <ControlBar/>
        </>
    )
}

export default MeetingLayout;