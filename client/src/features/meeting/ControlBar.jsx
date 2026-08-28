function ControlBar({
    roomCode,
    isScreenSharing, 
    onStartScreenShare, 
    onStopScreenShare,
    isAudioMuted,
    isVideoMuted,
    onToggleAudio,
    onToggleVideo,
    onLeaveMeeting,
    onTogglePlayground
}) {
    const handleScreenShareClick = async() => {
        try{
            if (isScreenSharing) {
                onStopScreenShare();
            } else {
                await onStartScreenShare();
            }
        }
        catch(error){
            console.log("Error in handleScreenShareClick:", error);
        }
    };

    return (
    <>
        <div className="ex-control-bar">
            {/* Background */}
            <img src="/images/hero/content-area.svg" className="ex-control-bar-bg" alt="" />
            
            <div className="flex items-center justify-center gap-4 z-10 w-full px-8 max-w-6xl mx-auto">
                {/* Audio */}
                <div className="ex-control-btn-wrapper" onClick={onToggleAudio}>
                    <img src={isAudioMuted ? "/images/hero/btn-gray.svg" : "/images/hero/btn-dark.svg"} className="ex-control-btn-svg" alt="" />
                    <button className={`ex-control-btn ${!isAudioMuted ? 'text-white' : ''}`}>
                        {isAudioMuted ? 'Unmute' : 'Mute'}
                    </button>
                </div>
                
                {/* Video */}
                <div className="ex-control-btn-wrapper" onClick={onToggleVideo}>
                    <img src={isVideoMuted ? "/images/hero/btn-gray.svg" : "/images/hero/btn-dark.svg"} className="ex-control-btn-svg" alt="" />
                    <button className={`ex-control-btn ${!isVideoMuted ? 'text-white' : ''}`}>
                        {isVideoMuted ? 'Turn On Video' : 'Turn Off Video'}
                    </button>
                </div>
                
                {/* Screen Share */}
                <div className="ex-control-btn-wrapper" onClick={handleScreenShareClick}>
                    <img src={isScreenSharing ? "/images/hero/btn-gray.svg" : "/images/hero/btn-dark.svg"} className="ex-control-btn-svg" alt="" />
                    <button className={`ex-control-btn ${!isScreenSharing ? 'text-white' : ''}`}>
                        {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                    </button>
                </div>
                
                {/* Raise Hand */}
                <div className="ex-control-btn-wrapper">
                    <img src="/images/hero/btn-dark.svg" className="ex-control-btn-svg" alt="" />
                    <button className="ex-control-btn text-white">Raise Hand</button>
                </div>
                
                {/* Playground */}
                <div className="ex-control-btn-wrapper" onClick={onTogglePlayground}>
                    <img src="/images/hero/btn-blue.svg" className="ex-control-btn-svg" alt="" />
                    <button className="ex-control-btn">Playground</button>
                </div>
                
                {/* Leave */}
                <div className="ex-control-btn-wrapper ml-auto" onClick={onLeaveMeeting}>
                    <img src="/images/hero/btn-red.svg" className="ex-control-btn-svg" alt="" />
                    <button className="ex-control-btn text-black font-bold">Leave</button>
                </div>
            </div>
        </div>
    </>
    )
}
export default ControlBar;