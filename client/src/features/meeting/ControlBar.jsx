function ControlBar({
    isScreenSharing, 
    onStartScreenShare, 
    onStopScreenShare,
    isAudioMuted,
    isVideoMuted,
    onToggleAudio,
    onToggleVideo,
    onLeaveMeeting
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
        <div className="p-4 bg-gray-950 border-t border-gray-800 w-full shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-center gap-4">
                <button 
                    onClick={onToggleAudio}
                    className={`cursor-pointer rounded-lg border px-5 py-2.5 transition-all font-semibold ${
                        isAudioMuted ? 'border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-[#00FFFF] hover:border-[#00FFFF]/50'
                    }`}
                >
                    {isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
                </button>
                
                <button 
                    onClick={onToggleVideo}
                    className={`cursor-pointer rounded-lg border px-5 py-2.5 transition-all font-semibold ${
                        isVideoMuted ? 'border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-[#00FFFF] hover:border-[#00FFFF]/50'
                    }`}
                >
                    {isVideoMuted ? 'Turn On Video' : 'Turn Off Video'}
                </button>
                
                <button
                    className={`cursor-pointer rounded-lg border px-5 py-2.5 transition-all font-semibold ${isScreenSharing
                            ? 'border-red-500 bg-red-500/10 hover:bg-red-500/20 text-red-500'
                            : 'border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-[#ff0] hover:border-[#ff0]/50'
                        }`}
                    onClick={handleScreenShareClick}
                >
                    {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                </button>
                
                <button className="cursor-pointer rounded-lg border border-gray-700 bg-gray-800 px-5 py-2.5 transition-all font-semibold text-white hover:bg-gray-700 hover:text-[#ff0] hover:border-[#ff0]/50">Raise Hand</button>
                
                <button 
                    onClick={onLeaveMeeting}
                    className="cursor-pointer rounded-lg border border-red-600 bg-red-600 px-6 py-2.5 text-white font-bold hover:bg-red-500 active:scale-95 transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] ml-4"
                >
                    Leave
                </button>
            </div>
        </div>
    </>
    )
}
export default ControlBar;