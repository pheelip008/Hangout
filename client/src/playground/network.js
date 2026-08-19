export const networkState = {
    isConnected: false,
    isInGame: false,
    roomCode: null,
    playerCount: 1,
    remotePlayers: {},
    couchSeats: { 0: null, 1: null, 2: null, 3: null },
    disabled: false
};

let socket = null;

// Callbacks for game layer
let onPlayerJoinedCb = null;
let onPlayerLeftCb = null;
let onRoomFullCb = null;
let onPlayerUpdateCb = null;
let onLocalPlayerSatCb = null;
let onLocalPlayerStoodCb = null;
let onRemotePlayerSatCb = null;
let onRemotePlayerStoodCb = null;

export function onNetworkEvents({ 
    onPlayerJoined, onPlayerLeft, onRoomFull, onPlayerUpdate,
    onLocalPlayerSat, onLocalPlayerStood, onRemotePlayerSat, onRemotePlayerStood
}) {
    onPlayerJoinedCb = onPlayerJoined;
    onPlayerLeftCb = onPlayerLeft;
    onRoomFullCb = onRoomFull;
    onPlayerUpdateCb = onPlayerUpdate;
    onLocalPlayerSatCb = onLocalPlayerSat;
    onLocalPlayerStoodCb = onLocalPlayerStood;
    onRemotePlayerSatCb = onRemotePlayerSat;
    onRemotePlayerStoodCb = onRemotePlayerStood;
}

export function initNetwork(roomCode, externalSocket = null) {
    networkState.roomCode = roomCode;

    if (!externalSocket) {
        networkState.disabled = true;
        networkState.isConnected = false;
        networkState.isInGame = false;
        updateDebugUI();
        return;
    }

    socket = externalSocket;
    networkState.isConnected = true;
    networkState.isInGame = true;

    // Send join request
    socket.emit("join-game", { roomCode });

    socket.on('game-state', (data) => {
        if (data && data.players) {
            networkState.couchSeats = data.couchSeats || { 0: null, 1: null, 2: null, 3: null };
            data.players.forEach(p => {
                if (p.id !== socket.id) {
                    networkState.remotePlayers[p.id] = p;
                    if (onPlayerJoinedCb) onPlayerJoinedCb(p);
                    
                    const seatId = Object.keys(networkState.couchSeats).find(k => networkState.couchSeats[k] === p.id);
                    if (seatId !== undefined && onRemotePlayerSatCb) {
                        onRemotePlayerSatCb({ id: p.id, seatId: parseInt(seatId) });
                    }
                }
            });
            networkState.playerCount = Object.keys(networkState.remotePlayers).length + 1;
            updateDebugUI();
        }
    });

    socket.on('game-user-joined', (data) => {
        const id = data.id;
        if (id && id !== socket.id) {
            networkState.remotePlayers[id] = data;
            networkState.playerCount = Object.keys(networkState.remotePlayers).length + 1;
            if (onPlayerJoinedCb) onPlayerJoinedCb(data);
            updateDebugUI();
        }
    });

    socket.on('game-user-left', (data) => {
        const id = data.id;
        if (networkState.remotePlayers[id]) {
            delete networkState.remotePlayers[id];
            if (onPlayerLeftCb) onPlayerLeftCb(id);
        }
        networkState.playerCount = Object.keys(networkState.remotePlayers).length + 1;
        updateDebugUI();
    });

    socket.on('game-player-update', (data) => {
        if (data.id && data.id !== socket.id) {
            if (onPlayerUpdateCb) onPlayerUpdateCb(data);
        }
    });

    socket.on('player-sat', (data) => {
        networkState.couchSeats[data.seatId] = data.id;
        if (data.id === socket.id) {
            if (onLocalPlayerSatCb) onLocalPlayerSatCb(data.seatId);
        } else {
            if (onRemotePlayerSatCb) onRemotePlayerSatCb(data);
        }
        updateDebugUI();
    });

    socket.on('player-stood', (data) => {
        const seatId = Object.keys(networkState.couchSeats).find(k => networkState.couchSeats[k] === data.id);
        if (seatId !== undefined) {
            networkState.couchSeats[seatId] = null;
        }
        if (data.id === socket.id) {
            if (onLocalPlayerStoodCb) onLocalPlayerStoodCb();
        } else {
            if (onRemotePlayerStoodCb) onRemotePlayerStoodCb(data.id);
        }
        updateDebugUI();
    });

    socket.on('game-room-full', () => {
        networkState.isInGame = false;
        if (onRoomFullCb) onRoomFullCb();
        updateDebugUI("Game is full (3/3)");
        // Do NOT disconnect the socket since it belongs to the Meet app!
    });
    
    updateDebugUI();
}

export function cleanupNetwork() {
    if (socket) {
        socket.off('game-state');
        socket.off('game-user-joined');
        socket.off('game-user-left');
        socket.off('game-player-update');
        socket.off('player-sat');
        socket.off('player-stood');
        socket.off('game-room-full');
    }
    onPlayerJoinedCb = null;
    onPlayerLeftCb = null;
    onRoomFullCb = null;
    onPlayerUpdateCb = null;
    onLocalPlayerSatCb = null;
    onLocalPlayerStoodCb = null;
    onRemotePlayerSatCb = null;
    onRemotePlayerStoodCb = null;
}

export function requestSit(seatId) {
    if (!socket || !networkState.isConnected) return;
    socket.emit("request-sit", { roomCode: networkState.roomCode, seatId });
}

export function leaveSeat() {
    if (!socket || !networkState.isConnected) return;
    socket.emit("leave-seat", { roomCode: networkState.roomCode });
}

function updateDebugUI(errorMessage = null) {
    const debugEl = document.getElementById('network-debug');
    if (!debugEl) return;
    
    if (networkState.disabled) {
        debugEl.innerHTML = `
            Connection: Standalone / Disabled<br>
            Room: ${networkState.roomCode}
        `;
        return;
    }

    if (errorMessage) {
        debugEl.innerHTML = `
            Connection: ${networkState.isConnected ? 'Connected' : 'Disconnected'}<br>
            Room: ${networkState.roomCode}<br>
            <span style="color: red;">${errorMessage}</span>
        `;
        return;
    }
    
    debugEl.innerHTML = `
        Connection: ${networkState.isConnected ? 'Connected' : 'Disconnected'}<br>
        Room: ${networkState.roomCode}<br>
        Game players: ${networkState.playerCount}/3
    `;
}
