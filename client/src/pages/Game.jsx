import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import API_BASE from '../config';

function Game() {
    const { roomCode } = useParams();
    const [status, setStatus] = useState('Connecting...');

    useEffect(() => {
        const socket = io(API_BASE, {
            withCredentials: true
        });

        socket.on('connect', () => {
            setStatus('Connected. Joining game...');
            socket.emit('join-game', { roomCode });
        });

        socket.on('game-room-full', () => {
            setStatus('Game Room Full (Max 3 players)');
            socket.disconnect();
        });

        socket.on('game-user-joined', (data) => {
            console.log('Player joined', data);
        });

        socket.on('game-user-left', (data) => {
            console.log('Player left', data);
        });

        socket.on('error', (err) => {
            setStatus(`Error: ${err}`);
        });

        return () => {
            socket.disconnect();
        };
    }, [roomCode]);

    return (
        <div className="h-screen w-screen bg-gray-900 text-white flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold mb-4">3D Playground</h1>
            <h2 className="text-2xl text-indigo-400 mb-8">Room: {roomCode}</h2>
            <div className="text-xl">{status}</div>
        </div>
    );
}

export default Game;
