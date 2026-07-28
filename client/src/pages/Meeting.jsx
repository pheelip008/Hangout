import React from 'react'
import '../pagescss/Meeting.css'
import API_BASE from '../config'
import MeetingLayout from '../layouts/MeetingLayout'
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { useRef,useState } from 'react';


function Meeting() {
    const localvideoRef = useRef(null);
    const peerConnection = useRef(null);
    const remoteSocketId = useRef(null);
    const { roomCode } = useParams();
    const remoteVideoRef = useRef(null);
    const pendingCandidates = useRef([]);
    const [remoteConnected, setRemoteConnected] = useState(false);
    const remoteScreenRef = useRef(null);
    const localScreenStreamRef = useRef(null);
    const screenSenderRef = useRef(null);
    const [isScreenSharing, setScreenSharing] = useState(false);
    const localScreenPreviewRef = useRef(null);
    const [isRemoteScreenSharing, setIsRemoteScreenSharing] = useState(false);
    const [localName, setLocalName] = useState("You");
    const [remoteName, setRemoteName] = useState("Remote User");
    const [startedAt, setStartedAt] = useState(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);




    useEffect(() => {
        const socket = io(API_BASE, {
            withCredentials: true
        });
        async function getTurnCredentials() {
            const res = await fetch(`${API_BASE}/api/turn-credentials`);
            const data = await res.json();
            return data;
        }
        async function fetchmedia() {
            const turnCredentials = await getTurnCredentials();
            peerConnection.current = new RTCPeerConnection({
                iceServers: [
                    ...turnCredentials,
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                ]
            });
            peerConnection.current.onnegotiationneeded=async ()=>{
                if(!remoteSocketId.current){
                    return;
                }
                try{
                    const offer=await peerConnection.current.createOffer();
                    await peerConnection.current.setLocalDescription(offer);
                    socket.emit('offer',{to:remoteSocketId.current,offer});
                }
                catch(error){
                    console.error("Renegotiation error", error);
                }
                

            }

            
            peerConnection.current.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log("ICE candidate type:", event.candidate.type, "|", event.candidate.candidate);
                }
                if (event.candidate && remoteSocketId.current) {
                    socket.emit('ice-candidate', {
                        to: remoteSocketId.current,
                        candidate: event.candidate
                    });
                }
            };
            peerConnection.current.ontrack = (event) => {
                console.log("ontrack fired! Streams:", event.streams);
                const stream = event.streams[0];
                
                // Track 1: Camera (Main Video)
                if (remoteVideoRef.current && (!remoteVideoRef.current.srcObject || remoteVideoRef.current.srcObject.id === stream.id)) {
                    remoteVideoRef.current.srcObject = stream;
                    setRemoteConnected(true);
                } 
                // Track 2: Screen Share
                else if (remoteScreenRef.current && (!remoteScreenRef.current.srcObject || remoteScreenRef.current.srcObject.id === stream.id)) {
                    remoteScreenRef.current.srcObject = stream;
                    setIsRemoteScreenSharing(true);
                    
                    stream.onremovetrack = () => {
                        if (stream.getTracks().length === 0) {
                            if (remoteScreenRef.current) {
                                remoteScreenRef.current.srcObject = null;
                            }
                            setIsRemoteScreenSharing(false);
                        }
                    };
                }
            };
            peerConnection.current.onconnectionstatechange = () => {
                console.log("Connection state changed:", peerConnection.current.connectionState);
                if (["disconnected", "failed", "closed"].includes(peerConnection.current.connectionState)) {
                    cleanupRemote();
                }
            };
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 24 } },
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            });
            if (localvideoRef.current) {
                localvideoRef.current.srcObject = stream;
            }
            stream.getTracks().forEach(track => {
                peerConnection.current.addTrack(track, stream);
            });

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
            remoteSocketId.current = id;
            if (name) setRemoteName(name);
            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);
            socket.emit('offer', { to: id, offer });
        });
        socket.on('offer', async ({ from, offer, name }) => {
            console.log('offer received from:', from, name);
            remoteSocketId.current = from;
            if (name) setRemoteName(name);
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer))
            for (const candidate of pendingCandidates.current) {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
            pendingCandidates.current = [];
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            socket.emit('answer', { to: from, answer })
        })
        socket.on('answer', async ({ from, answer, name }) => {
            console.log('answer received from:', from, name);
            if (name) setRemoteName(name);
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
            for (const candidate of pendingCandidates.current) {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
            pendingCandidates.current = [];
        });
        socket.on('ice-candidate', async ({ from, candidate }) => {
            console.log('ice-candidate received from:', from);
            if (peerConnection.current.remoteDescription) {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
                pendingCandidates.current.push(candidate);
            }
        });
        socket.on('error', (message) => {
            alert(message);
        });


        function cleanupRemote() {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
            }
            setRemoteConnected(false);
            remoteSocketId.current = null;
        }
        socket.on('user-left', (leftSocketId) => {
            if (leftSocketId === remoteSocketId.current) {
                cleanupRemote();
                setRemoteName("Remote User");
            }
        });
      
        async function initializeMeeting() {
            await fetchmedia(); 
            socket.emit('join-room', roomCode); 
        }
        initializeMeeting();

        return () => {
            socket.disconnect();
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
        screenSenderRef.current = [];
            stream.getTracks().forEach(track => {
                const sender = peerConnection.current.addTrack(track, stream);
                screenSenderRef.current.push(sender);
                
                track.onended = () => {
                    stopScreenShare();
                };
            });
            
            setScreenSharing(true);
        }catch(error){
            console.error("error sharing the screen",error);
        }

        
    }

    async function stopScreenShare(){
        if(screenSenderRef.current&&peerConnection.current){
            screenSenderRef.current.forEach(sender => {
                peerConnection.current.removeTrack(sender);
            });
            screenSenderRef.current=null;
            
            
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
            <div className="h-screen w-screen bg-gray-900 overflow-hidden flex flex-col">
            <MeetingLayout 
                isLocalScreenSharing={isScreenSharing}
                isRemoteScreenSharing={isRemoteScreenSharing}
                localVideoRef={localvideoRef}
                remoteVideoRef={remoteVideoRef}
                localScreenPreviewRef={localScreenPreviewRef}
                remoteScreenRef={remoteScreenRef}
                onStartScreenShare={startScreenShare} 
                onStopScreenShare={stopScreenShare}
                localName={localName}
                remoteName={remoteName}
                startedAt={startedAt}
                remoteConnected={remoteConnected}
                isAudioMuted={isAudioMuted}
                isVideoMuted={isVideoMuted}
                onToggleAudio={toggleAudio}
                onToggleVideo={toggleVideo}
                onLeaveMeeting={leaveMeeting}
            />
        </div>
        </>
    )
}
export default Meeting;