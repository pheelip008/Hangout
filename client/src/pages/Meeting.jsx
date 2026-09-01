import React from 'react'
import '../pagescss/Meeting.css'
import API_BASE from '../config'
import MeetingLayout from '../layouts/MeetingLayout'
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { useRef,useState } from 'react';


function Meeting() {
    const socketRef = useRef(null);
    const localvideoRef = useRef(null);
    const peerConnections = useRef({});
    const pendingCandidates = useRef({});
    const participantCameraStreams = useRef({});
    // peerId -> the MediaStream.id that peer announced as its screen share
    const screenStreamIds = useRef({});
    const [participants, setParticipants] = useState({});
    
    const { roomCode } = useParams();
    const remoteScreenRef = useRef(null);
    const localScreenStreamRef = useRef(null);
    const screenSendersRef = useRef({});
    const [isScreenSharing, setScreenSharing] = useState(false);
    const localScreenPreviewRef = useRef(null);
    const [isRemoteScreenSharing, setIsRemoteScreenSharing] = useState(false);
    const makingOffer = useRef({});
    const ignoreOffer = useRef({});
    const [localName, setLocalName] = useState("You");
    const turnCredentialsRef = useRef(null);
    const [startedAt, setStartedAt] = useState(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);




    useEffect(() => {
        const socket = io(API_BASE, {
            withCredentials: true
        });
        socketRef.current = socket;
        async function getTurnCredentials() {
            const res = await fetch(`${API_BASE}/api/turn-credentials`);
            const data = await res.json();
            return data;
        }
        async function fetchmedia() {
            const turnCredentials = await getTurnCredentials();
            turnCredentialsRef.current = turnCredentials;
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 24 } },
                    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
                });
                if (localvideoRef.current) {
                    localvideoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Failed to get local media", err);
            }
        }

        function createPeerConnection(id, name) {
            if (peerConnections.current[id]) return peerConnections.current[id];

            const pc = new RTCPeerConnection({
                iceServers: [
                    ...(turnCredentialsRef.current || []),
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                ]
            });
            peerConnections.current[id] = pc;
            pendingCandidates.current[id] = pendingCandidates.current[id] || [];

            // Add local camera tracks immediately
            if (localvideoRef.current && localvideoRef.current.srcObject) {
                localvideoRef.current.srcObject.getTracks().forEach(track => {
                    pc.addTrack(track, localvideoRef.current.srcObject);
                });
            }

            // Add local screen share tracks if active
            if (localScreenStreamRef.current) {
                if (!screenSendersRef.current[id]) screenSendersRef.current[id] = [];
                localScreenStreamRef.current.getTracks().forEach(track => {
                    const sender = pc.addTrack(track, localScreenStreamRef.current);
                    screenSendersRef.current[id].push(sender);
                });
                // This peer is joining mid-share, so both streams reach it at once and
                // arrival order is not guaranteed. Name the screen stream up front:
                // socket.io keeps message order, and the offer only goes out later from
                // the async onnegotiationneeded handler, so this lands first.
                socket.emit('screen-share-started', {
                    to: id,
                    streamId: localScreenStreamRef.current.id
                });
            }

            pc.onnegotiationneeded = async () => {
                try {
                    makingOffer.current[id] = true;
                    await pc.setLocalDescription();
                    socket.emit('offer', { to: id, offer: pc.localDescription });
                } catch (error) {
                    console.error("Renegotiation error", error);
                } finally {
                    makingOffer.current[id] = false;
                }
            };

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('ice-candidate', {
                        to: id,
                        candidate: event.candidate
                    });
                }
            };

            pc.ontrack = (event) => {
                const stream = event.streams[0];
                // If the peer told us which stream is its screen we know outright.
                // Otherwise fall back to the old guess: a peer's first stream is its
                // camera. That guess only breaks when someone joins mid-share, which is
                // exactly the case the announcement covers.
                const announcedScreenId = screenStreamIds.current[id];
                const isScreenShare = announcedScreenId
                    ? stream.id === announcedScreenId
                    : !!participantCameraStreams.current[id] && participantCameraStreams.current[id].id !== stream.id;

                if (!isScreenShare) {
                    participantCameraStreams.current[id] = stream;
                    setParticipants(prev => ({
                        ...prev,
                        [id]: { ...(prev[id] || { id, name }), stream }
                    }));
                } else {
                    if (remoteScreenRef.current && (!remoteScreenRef.current.srcObject || remoteScreenRef.current.srcObject.id === stream.id)) {
                        remoteScreenRef.current.srcObject = stream;
                        setIsRemoteScreenSharing(true);
                        stream.onremovetrack = () => {
                            if (stream.getTracks().length === 0) {
                                if (remoteScreenRef.current) remoteScreenRef.current.srcObject = null;
                                setIsRemoteScreenSharing(false);
                            }
                        };
                    }
                }
            };

            pc.onconnectionstatechange = () => {
                if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
                    cleanupRemote(id);
                }
            };

            return pc;
        }

        socket.on('connect', () => {
            console.log('Connected to server with id:', socket.id);
          
        });

        socket.on('meeting-info', ({ startedAt, localName }) => {
            setStartedAt(startedAt);
            if (localName) setLocalName(localName);
        });

        socket.on('user-joined', async ({ id, name }) => {
            console.log('user-joined received:', id, name);
            createPeerConnection(id, name);
            setParticipants(prev => ({ ...prev, [id]: { ...(prev[id] || {}), id, name } }));
            
        });
        
        socket.on('offer', async ({ from, offer, name }) => {
            console.log('offer received from:', from, name);
            const pc = createPeerConnection(from, name);
            setParticipants(prev => ({ ...prev, [from]: { ...(prev[from] || {}), id: from, name } }));
            
            const polite = socket.id > from;
            const offerCollision = makingOffer.current[from] || pc.signalingState !== "stable";
            
            ignoreOffer.current[from] = !polite && offerCollision;
            if (ignoreOffer.current[from]) {
                console.log('Ignoring colliding offer from:', from);
                return;
            }

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                if (pendingCandidates.current[from]) {
                    for (const candidate of pendingCandidates.current[from]) {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                    pendingCandidates.current[from] = [];
                }
                await pc.setLocalDescription();
                socket.emit('answer', { to: from, answer: pc.localDescription });
            } catch (err) {
                console.error("Failed to handle offer", err);
            }
        });
        
        socket.on('answer', async ({ from, answer, name }) => {
            console.log('answer received from:', from, name);
            const pc = createPeerConnection(from, name);
            setParticipants(prev => ({ ...prev, [from]: { ...(prev[from] || {}), id: from, name } }));
            
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            if (pendingCandidates.current[from]) {
                for (const candidate of pendingCandidates.current[from]) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
                pendingCandidates.current[from] = [];
            }
        });
        
        socket.on('ice-candidate', async ({ from, candidate }) => {
            console.log('ice-candidate received from:', from);
            const pc = peerConnections.current[from];
            try {
                if (pc) {
                    if (ignoreOffer.current[from]) return;
                    
                    if (pc.remoteDescription) {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    } else {
                        if (!pendingCandidates.current[from]) pendingCandidates.current[from] = [];
                        pendingCandidates.current[from].push(candidate);
                    }
                }
            } catch (err) {
                console.warn('Failed to add ICE candidate', err);
            }
        });
        socket.on('screen-share-started', ({ from, streamId }) => {
            screenStreamIds.current[from] = streamId;
        });

        socket.on('screen-share-stopped', ({ from }) => {
            const stoppedStreamId = screenStreamIds.current[from];
            delete screenStreamIds.current[from];

            // Only tear the stage down if the stream on it is the one that stopped
            if (remoteScreenRef.current && stoppedStreamId &&
                remoteScreenRef.current.srcObject &&
                remoteScreenRef.current.srcObject.id === stoppedStreamId) {
                remoteScreenRef.current.srcObject = null;
                setIsRemoteScreenSharing(false);
            }
        });

        socket.on('error', (message) => {
            alert(message);
        });


        function cleanupRemote(id) {
            const pc = peerConnections.current[id];
            if (pc) {
                pc.close();
                delete peerConnections.current[id];
            }
            delete pendingCandidates.current[id];
            delete participantCameraStreams.current[id];
            delete screenStreamIds.current[id];
            if (screenSendersRef.current[id]) delete screenSendersRef.current[id];
            
            setParticipants(prev => {
                const newParticipants = { ...prev };
                delete newParticipants[id];
                return newParticipants;
            });
        }
        
        socket.on('user-left', (leftSocketId) => {
            cleanupRemote(leftSocketId);
        });
      
        async function initializeMeeting() {
            await fetchmedia(); 
            socket.emit('join-room', roomCode); 
        }
        initializeMeeting();

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, []);
    async function startScreenShare(){
        try{
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: { ideal: 15 } }, // Reduce framerate to prevent lag
                audio: true
            });
        localScreenStreamRef.current = stream;
        if (localScreenPreviewRef.current) {
            localScreenPreviewRef.current.srcObject = stream;
        }
        
        // Add screen track to all active peer connections
        Object.keys(peerConnections.current).forEach(id => {
            const pc = peerConnections.current[id];
            if (!screenSendersRef.current[id]) screenSendersRef.current[id] = [];
            stream.getTracks().forEach(track => {
                const sender = pc.addTrack(track, stream);
                screenSendersRef.current[id].push(sender);
                
                track.onended = () => {
                    stopScreenShare();
                };
            });
        });
        
        // Announce before renegotiation so receivers can tell this stream from a camera
        if (socketRef.current) {
            socketRef.current.emit('screen-share-started', { streamId: stream.id });
        }

        setScreenSharing(true);
        }catch(error){
            console.error("error sharing the screen",error);
        }

        
    }

    async function stopScreenShare() {
        Object.keys(screenSendersRef.current).forEach(id => {
            const senders = screenSendersRef.current[id];
            const pc = peerConnections.current[id];
            if (pc && senders) {
                senders.forEach(sender => pc.removeTrack(sender));
            }
        });
        screenSendersRef.current = {};
        if (socketRef.current) {
            socketRef.current.emit('screen-share-stopped');
        }
    if(localScreenStreamRef.current){
        localScreenStreamRef.current.getTracks().forEach(track=>track.stop());
        localScreenStreamRef.current=null;
        setScreenSharing(false)
    }
    if (localScreenPreviewRef.current) {
            localScreenPreviewRef.current.srcObject = null;
        }
}

    const toggleAudio = () => {
        if (localvideoRef.current && localvideoRef.current.srcObject) {
            const audioTrack = localvideoRef.current.srcObject.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localvideoRef.current && localvideoRef.current.srcObject) {
            const videoTrack = localvideoRef.current.srcObject.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoMuted(!videoTrack.enabled);
            }
        }
    };

    const leaveMeeting = () => {
        window.location.href = '/home'; 
    };

    return (
        <>
            <div className="ex-page flex flex-col h-screen w-screen overflow-hidden">
            <MeetingLayout 
                roomCode={roomCode}
                isLocalScreenSharing={isScreenSharing}
                isRemoteScreenSharing={isRemoteScreenSharing}
                localVideoRef={localvideoRef}
                localScreenPreviewRef={localScreenPreviewRef}
                remoteScreenRef={remoteScreenRef}
                onStartScreenShare={startScreenShare} 
                onStopScreenShare={stopScreenShare}
                localName={localName}
                startedAt={startedAt}
                isAudioMuted={isAudioMuted}
                isVideoMuted={isVideoMuted}
                onToggleAudio={toggleAudio}
                onToggleVideo={toggleVideo}
                onLeaveMeeting={leaveMeeting}
                socketRef={socketRef}
                localScreenStreamRef={localScreenStreamRef}
                participants={participants}
            />
        </div>
        </>
    )
}
export default Meeting;