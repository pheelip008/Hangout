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
                const stream=event.streams[0]
                if (remoteVideoRef.current && !remoteVideoRef.current.srcObject) {
                    remoteVideoRef.current.srcObject = stream;
                    remoteVideoRef.current.play().catch(error => {
                        console.log("Remote video play() failed:", error);
                    });
                    setRemoteConnected(true);
                }
                else if(remoteVideoRef.current.srcObject.id!==stream.id){
                    remoteScreenRef.current.srcObject=stream;
                    remoteScreenRef.current.play().catch(error => {
                        console.log("Remote screenshare play() failed:", error);
                    });
                    setIsRemoteScreenSharing(true);
                    stream.onremovetrack=()=>{
                        if(stream.getTracks().length===0){
                            if(remoteScreenRef.current){
                                remoteScreenRef.current.srcObject=null;
                                setIsRemoteScreenSharing(false);
                            }
                        }

                }
                }
            };
            peerConnection.current.onconnectionstatechange = () => {
                console.log("Connection state changed:", peerConnection.current.connectionState);
                if (["disconnected", "failed", "closed"].includes(peerConnection.current.connectionState)) {
                    cleanupRemote();
                }
            };
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
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

        socket.on('user-joined', async (newUserSocketId) => {
            console.log('user-joined received:', newUserSocketId);
            remoteSocketId.current = newUserSocketId;
            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);
            socket.emit('offer', { to: newUserSocketId, offer });
        })
        socket.on('offer', async ({ from, offer }) => {
            console.log('offer received from:', from);
            remoteSocketId.current = from;
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer))
            for (const candidate of pendingCandidates.current) {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
            pendingCandidates.current = [];
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            socket.emit('answer', { to: from, answer })
        })
        socket.on('answer', async ({ from, answer }) => {
            console.log('answer received from:', from);
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
            const stream = await navigator.mediaDevices.getDisplayMedia({video:true,audio:true});
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
            />
        </div>
        </>
    )
}
export default Meeting;