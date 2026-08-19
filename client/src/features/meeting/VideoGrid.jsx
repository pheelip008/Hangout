function VideoGrid({ 
    isLocalScreenSharing, 
    isRemoteScreenSharing,
    localVideoRef, 
    participants,
    remoteVideoRefs,
    localScreenPreviewRef, 
    remoteScreenRef,
    localName
}) {
    const isSpotlight = isLocalScreenSharing || isRemoteScreenSharing;

    const remoteParticipants = Object.values(participants || {});
    const totalTiles = 1 + remoteParticipants.length;

    const getTileWidthClass = () => {
        if (isSpotlight) return 'w-full';
        if (totalTiles === 1) return 'w-full max-w-5xl';
        if (totalTiles === 2) return 'w-[calc(50%-0.5rem)] max-w-3xl';
        return 'w-[calc(50%-0.5rem)] max-w-2xl';
    };

    const tileClass = `relative flex items-center justify-center bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 aspect-video group ${getTileWidthClass()}`;

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

            {/* CAMERAS GRID / SIDEBAR */}
            <div className={`flex gap-4 transition-all duration-300 content-center ${isSpotlight ? 'w-64 flex-col' : 'flex-1 flex-row flex-wrap items-center justify-center p-4'}`}>
                 
                 {/* Local Camera */}
                 <div className={tileClass}>
                    <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    <span className="absolute bottom-4 left-4 bg-gray-950/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-200 border border-gray-700/50 truncate max-w-[80%]">{localName || "You"}</span>
                 </div>
                 
                 {/* Remote Cameras */}
                 {remoteParticipants.map(p => (
                     <div key={p.id} className={tileClass}>
                        <video 
                            ref={(el) => {
                                if (el) {
                                    if (remoteVideoRefs && remoteVideoRefs.current) {
                                        remoteVideoRefs.current[p.id] = el;
                                    }
                                    if (p.stream && el.srcObject !== p.stream) {
                                        el.srcObject = p.stream;
                                    }
                                } else {
                                    if (remoteVideoRefs && remoteVideoRefs.current) {
                                        delete remoteVideoRefs.current[p.id];
                                    }
                                }
                            }}
                            autoPlay 
                            playsInline 
                            className="w-full h-full object-cover" 
                        />
                        <span className="absolute bottom-4 left-4 bg-gray-950/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-200 border border-gray-700/50 truncate max-w-[80%]">{p.name || "Remote User"}</span>
                     </div>
                 ))}
                 
            </div>
        </div>
    );
}
export default VideoGrid;
