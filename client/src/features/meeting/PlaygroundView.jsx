import React, { useEffect, useRef, useState } from 'react';
import { initThreeJsGame } from '../../playground/game/index.js';

function PlaygroundView({ 
    roomCode, socketRef, localScreenStreamRef, remoteScreenRef, 
    isLocalScreenSharing, isRemoteScreenSharing, playerName,
    localVideoRef, participants
}) {
    // 1. Define the mount point for the eventual Three.js canvas
    const containerRef = useRef(null);

    // 2. Resolve the active screen share MediaStream
    let activeScreenStream = null;
    if (isLocalScreenSharing && localScreenStreamRef?.current) {
        activeScreenStream = localScreenStreamRef.current;
    } else if (isRemoteScreenSharing && remoteScreenRef?.current?.srcObject) {
        activeScreenStream = remoteScreenRef.current.srcObject;
    }

    const [isGameLoaded, setIsGameLoaded] = useState(false);
    const gameInstanceRef = useRef(null);

    // Store active screen stream in a ref so we can safely update the game instance without recreating it
    const activeScreenStreamRef = useRef(activeScreenStream);
    useEffect(() => {
        activeScreenStreamRef.current = activeScreenStream;
        if (gameInstanceRef.current && typeof gameInstanceRef.current.updateScreenShareStream === 'function') {
            gameInstanceRef.current.updateScreenShareStream(activeScreenStream);
        }
    }, [activeScreenStream]);

    // 3. Resolve Camera Streams
    const localCameraStream = localVideoRef?.current?.srcObject || null;
    const remoteCameraStreams = {};
    if (participants) {
        Object.values(participants).forEach(p => {
            if (p.stream) {
                remoteCameraStreams[p.id] = p.stream;
            }
        });
    }

    // Pass dynamic updates to the game integration without reloading
    useEffect(() => {
        if (gameInstanceRef.current && typeof gameInstanceRef.current.updateCameraStreams === 'function') {
            gameInstanceRef.current.updateCameraStreams({
                localCameraStream,
                remoteCameraStreams
            });
        }
    }, [localCameraStream, participants]);

    useEffect(() => {
        let mounted = true;

        if (!containerRef.current) return;

        gameInstanceRef.current = initThreeJsGame({
            container: containerRef.current,
            roomCode: roomCode,
            socket: socketRef?.current,
            screenShareStream: activeScreenStreamRef.current,
            playerName: playerName,
            localCameraStream: localCameraStream,
            remoteCameraStreams: remoteCameraStreams
        });
        
        setIsGameLoaded(true);

        return () => {
            mounted = false;
            
            if (socketRef?.current) {
                socketRef.current.emit("leave-game", { roomCode });
            }

            if (gameInstanceRef.current && gameInstanceRef.current.destroy) {
                gameInstanceRef.current.destroy();
                gameInstanceRef.current = null;
            }
        };
    }, []); // Empty dependency array: only initialize once

    return (
        <div className="w-full h-full bg-black relative flex flex-col items-center justify-center">
            {/* The actual div where Three.js will append its <canvas> */}
            <div ref={containerRef} className="absolute inset-0 w-full h-full"></div>

            {/* Temporary UI overlay indicating the integration boundary */}
            {!isGameLoaded && (
                <div className="z-10 bg-gray-900/80 backdrop-blur-md p-8 rounded-2xl border border-gray-700 shadow-2xl max-w-2xl w-full text-white pointer-events-auto">
                    <h1 className="text-4xl font-bold text-indigo-400 mb-2">3D Playground</h1>
                    <p className="text-gray-400 mb-6 border-b border-gray-700 pb-4">Loading game...</p>
                    
                    <h2 className="text-xl font-semibold mb-3">Provided Game Interface:</h2>
                    <div className="bg-black/50 p-4 rounded-lg font-mono text-sm text-gray-300 mb-6 overflow-x-auto">
                        <pre>
{`{
  container: <HTMLDivElement>, // Full-screen absolute div
  roomCode: "${roomCode}",
  socket: ${socketRef?.current ? '<Socket.IO Client Active>' : 'null'},
  screenShareStream: ${activeScreenStream ? '<MediaStream Active>' : 'null'},
  playerName: "${playerName}",
  localCameraStream: ${localCameraStream ? '<MediaStream Active>' : 'null'},
  remoteCameraStreams: ${Object.keys(remoteCameraStreams).length > 0 ? '{ [socketId]: <MediaStream Active> }' : '{}'}
}`}
                        </pre>
                    </div>
                </div>
            )}
            <div className="absolute bottom-6 text-gray-400 text-sm animate-pulse z-10 pointer-events-none">
                Press 'P' to return to meeting
            </div>
        </div>
    );
}

export default PlaygroundView;
