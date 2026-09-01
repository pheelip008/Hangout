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
        <div className="ex-video-grid-container transition-all duration-300">
            
            {/* MAIN STAGE (Screen Share) - Only visible when someone is sharing.
                This stage stays MOUNTED and is hidden with a style instead of being
                conditionally rendered. Meeting.jsx writes srcObject onto these refs
                before isSpotlight can possibly be true, so unmounting the stage leaves
                both refs null at exactly the moment the stream arrives - the local
                preview comes up blank and remote sharing never turns on at all.
                Inline display beats .ex-video-tile's own `display: flex`. */}
            <div
                className="ex-video-tile flex-1 bg-transparent"
                style={{ display: isSpotlight ? 'flex' : 'none' }}
            >
                <img src="/images/hero/content-area.svg" className="ex-video-tile-bg" alt="" />
                <div className="w-full h-full flex items-center justify-center p-4 relative z-10">

                    {/* Both preview videos are ALWAYS in the HTML, we just hide the one we aren't using! */}
                    <video
                        ref={localScreenPreviewRef}
                        autoPlay playsInline muted
                        className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl border-4 border-[#1e1e1e] ${isLocalScreenSharing ? 'block' : 'hidden'}`}
                    />
                    <video
                        ref={remoteScreenRef}
                        autoPlay playsInline
                        className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl border-4 border-[#1e1e1e] ${isRemoteScreenSharing ? 'block' : 'hidden'}`}
                    />

                    {isLocalScreenSharing && (
                        <div className="absolute top-8 left-8 bg-[#fa5252] text-[#1e1e1e] px-4 py-2 rounded animate-pulse font-bold font-['Excalifont'] border-2 border-black shadow-[4px_4px_0_#1e1e1e]">
                            You are sharing
                        </div>
                    )}
                </div>
            </div>

            {/* CAMERAS GRID / SIDEBAR */}
            <div className={`flex gap-8 transition-all duration-300 content-center ${isSpotlight ? 'w-64 flex-col' : 'flex-1 flex-row flex-wrap items-center justify-center p-4'}`}>
                 
                 {/* Local Camera */}
                 <div className={`ex-video-tile ${getTileWidthClass()}`}>
                    <img src="/images/hero/card-alt1.svg" className="ex-video-tile-bg" alt="" />
                    <video ref={localVideoRef} autoPlay muted playsInline className="ex-video-element" />
                    <span className={`ex-video-name-tag ${isSpotlight ? 'ex-video-name-tag--compact' : ''}`}>{localName || "You"}</span>
                 </div>
                 
                 {/* Remote Cameras */}
                 {remoteParticipants.map((p, i) => (
                     <div key={p.id} className={`ex-video-tile ${getTileWidthClass()}`}>
                        <img src={i % 2 === 0 ? "/images/hero/card-alt2.svg" : "/images/hero/card-alt1.svg"} className="ex-video-tile-bg" alt="" />
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
                            className="ex-video-element" 
                        />
                        <span className={`ex-video-name-tag ${isSpotlight ? 'ex-video-name-tag--compact' : ''}`}>{p.name || "Remote User"}</span>
                     </div>
                 ))}
                 
            </div>
        </div>
    );
}
export default VideoGrid;
