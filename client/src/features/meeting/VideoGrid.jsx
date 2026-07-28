function VideoGrid({ 
    isLocalScreenSharing, 
    isRemoteScreenSharing,
    localVideoRef, 
    remoteVideoRef, 
    localScreenPreviewRef, 
    remoteScreenRef,
    localName,
    remoteName,
    remoteConnected
}) {
    const isSpotlight = isLocalScreenSharing || isRemoteScreenSharing;

    return (
        <div className="w-full h-full flex gap-4 transition-all duration-300">
            
            {/* MAIN STAGE (Screen Share) - Only visible when someone is sharing */}
            <div className={`flex-1 items-center justify-center rounded-2xl bg-gray-950 overflow-hidden relative border border-gray-800 shadow-2xl ${isSpotlight ? 'flex' : 'hidden'}`}>
                <div className="w-full h-full flex items-center justify-center p-2 relative">
                    
                    {/* Both preview videos are ALWAYS in the HTML, we just hide the one we aren't using! */}
                    <video 
                        ref={localScreenPreviewRef} 
                        autoPlay playsInline muted 
                        className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl ${isLocalScreenSharing ? 'block' : 'hidden'}`} 
                    />
                    <video 
                        ref={remoteScreenRef} 
                        autoPlay playsInline 
                        className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl ${isRemoteScreenSharing ? 'block' : 'hidden'}`} 
                    />
                    
                    {isLocalScreenSharing && (
                        <div className="absolute top-4 left-4 bg-red-600 px-3 py-1 rounded animate-pulse font-bold">
                            You are sharing
                        </div>
                    )}
                </div>
            </div>

            {/* CAMERAS GRID / SIDEBAR 
                If NO ONE is sharing -> This is a full-width horizontal row (50% each)
                If SOMEONE is sharing -> This magically squishes into a 64px vertical sidebar on the right!
            */}
            <div className={`flex gap-4 transition-all duration-300 ${isSpotlight ? 'w-64 flex-col' : 'flex-1 flex-row items-center justify-center p-4'}`}>
                 
                 {/* Local Camera */}
                 <div className={`relative flex items-center justify-center bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${isSpotlight ? 'aspect-video' : (remoteConnected ? 'w-1/2 aspect-video' : 'w-full max-w-5xl aspect-video')} group`}>
                    <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    <span className="absolute bottom-4 left-4 bg-gray-950/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-200 border border-gray-700/50">{localName || "You"}</span>
                 </div>
                 
                 {/* Remote Camera */}
                 <div className={`relative flex items-center justify-center bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${isSpotlight ? 'aspect-video' : 'w-1/2 aspect-video'} ${!remoteConnected ? 'hidden' : 'flex'} group`}>
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <span className="absolute bottom-4 left-4 bg-gray-950/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-200 border border-gray-700/50">{remoteName || "Remote User"}</span>
                 </div>
                 
            </div>
        </div>
    );
}
export default VideoGrid;
