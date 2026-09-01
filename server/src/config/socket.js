const { Server } = require('socket.io');
const cookie = require("cookie");
const { CLIENT_ORIGIN } = require('./network');



const jwt = require('jsonwebtoken');
const prisma = require("../../prisma/prisma")


const gameRoomSeats = new Map();

function initSocket(server) {
  const io = new Server(server,
    {
      cors: {
        origin: [CLIENT_ORIGIN, "http://localhost:5173", "http://localhost:8080"],
        credentials: true
      }
    }
  );
  io.use((socket, next) => {
    console.log("Raw cookies received:", socket.handshake.headers.cookie);
    try {
      const rawCookies = socket.handshake.headers.cookie;
      if (!rawCookies) {
        return next(new Error("No cookies found"));
      }

      const parsedCookies = cookie.parseCookie(rawCookies);
      console.log("Parsed cookies:", parsedCookies);

      const token = parsedCookies.token;
      console.log("Extracted token:", token);

      if (!token) {
        return next(new Error("No token found"));
      }

      console.log("Using JWT_SECRET:", process.env.JWT_SECRET ? "Present" : "Missing");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded JWT:", decoded);

      socket.userId = decoded.userId;
      next();
    } catch (error) {
      console.log("Error caught in socket auth middleware:", error.message);
      next(new Error("Invalid token"));
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on('join-room', async (roomCode) => {
      console.log("join-room event received with code:", roomCode);
      let meeting = await prisma.meeting.findUnique({
        where: { roomCode }
      })
      if (!meeting) return socket.emit('error', "Invalid room code");
      if (meeting.status === "scheduled") {
        meeting = await prisma.meeting.update({
          where: { id: meeting.id },
          data: {
            status: "ongoing",
            startedAt: new Date()
          }
        });
      }
      
      const user = await prisma.user.findUnique({
        where: { id: socket.userId }
      });
      socket.userName = user.name;
      
      socket.emit('meeting-info', { startedAt: meeting.startedAt, localName: socket.userName });

      const participant = await prisma.participant.findFirst({
        where: { userId: socket.userId, meetingID: meeting.id }
      })
      if (!participant) {
        return socket.emit('error', 'You are not a participant of this meeting')
      }
      socket.join(roomCode);
      socket.roomCode = roomCode;
      console.log(`Socket ${socket.id} (user ${socket.userId}) joined room ${roomCode}`);
      socket.to(roomCode).emit('user-joined', { id: socket.id, name: socket.userName });

    });
    socket.on('offer', ({ to, offer }) => {
      console.log(`relaying offer from ${socket.id} to ${to}`)
      io.to(to).emit('offer', { from: socket.id, offer, name: socket.userName });

    });
    socket.on('answer', ({ to, answer }) => {
      console.log(`Relaying answer from ${socket.id} to ${to}`);
      io.to(to).emit('answer', { from: socket.id, answer, name: socket.userName });
    });
    socket.on('ice-candidate', ({ to, candidate }) => {
      console.log(`Relaying ice-candidate from ${socket.id} to ${to}`);
      io.to(to).emit('ice-candidate', { from: socket.id, candidate });
    });

    // Lets receivers tell a screen share apart from a camera. Addressed to one peer
    // when someone joins mid-share, broadcast to the room when a share starts.
    socket.on('screen-share-started', ({ to, streamId }) => {
      if (to) {
        io.to(to).emit('screen-share-started', { from: socket.id, streamId });
      } else if (socket.roomCode) {
        socket.to(socket.roomCode).emit('screen-share-started', { from: socket.id, streamId });
      }
    });

    socket.on('screen-share-stopped', () => {
      if (socket.roomCode) {
        socket.to(socket.roomCode).emit('screen-share-stopped', { from: socket.id });
      }
    });

    socket.on('join-game', async ({ roomCode }) => {
      console.log(`join-game event received with code: ${roomCode}`);
      try {
        const meeting = await prisma.meeting.findUnique({
          where: { roomCode }
        });
        if (!meeting) return socket.emit('error', "Invalid room code");

        const participant = await prisma.participant.findFirst({
          where: { userId: socket.userId, meetingID: meeting.id }
        });
        if (!participant) {
          return socket.emit('error', 'You are not a participant of this meeting');
        }

        const user = await prisma.user.findUnique({
          where: { id: socket.userId }
        });
        socket.userName = user.name;

        const gameRoom = `game-${roomCode}`;
        const existingSockets = await io.in(gameRoom).fetchSockets();
        const roomSize = existingSockets.length;

        // 4. Check the existing 3-player game limit
        if (roomSize >= 3) {
          socket.emit('game-room-full');
          return;
        }

        // 5. Collect the existing game players BEFORE adding the new socket
        const players = existingSockets.map(s => ({
          id: s.id,
          name: s.userName
        }));

        let seats = gameRoomSeats.get(roomCode);
        if (!seats) {
          seats = { "0": null, "1": null, "2": null, "3": null };
          gameRoomSeats.set(roomCode, seats);
        }

        // 6. Send the new socket the game-state event containing those existing players
        socket.emit('game-state', { players, couchSeats: seats });

        // 7. Add the new socket to game-${roomCode}
        socket.join(gameRoom);
        socket.gameRoom = gameRoom;
        console.log(`Socket ${socket.id} joined game room ${gameRoom}`);
        
        // 8. Broadcast game-user-joined to the other game players
        socket.to(gameRoom).emit('game-user-joined', { id: socket.id, name: socket.userName });
      } catch (error) {
        console.error("Error in join-game:", error);
        socket.emit('error', "Failed to join game");
      }
    });

    socket.on('leave-game', async ({ roomCode }) => {
      console.log(`leave-game event received with code: ${roomCode}`);
      try {
        if (!socket.userId) return; // Verify authentication
        if (!roomCode) return; // Verify valid roomCode
        
        const gameRoom = `game-${roomCode}`;
        
        // Verify the socket is actually a member of that game room
        if (socket.gameRoom === gameRoom) {
          // Release any couch seat owned by that socket
          let seats = gameRoomSeats.get(roomCode);
          if (seats) {
            const currentSeat = Object.keys(seats).find(k => seats[k] === socket.id);
            if (currentSeat) {
              seats[currentSeat] = null;
              socket.to(gameRoom).emit('player-stood', { id: socket.id, seatId: parseInt(currentSeat) });
            }
          }

          socket.leave(gameRoom);
          delete socket.gameRoom; // Clear to prevent duplicate events on disconnect
          
          console.log(`Socket ${socket.id} left game room ${gameRoom}`);
          // Broadcast to remaining players in the game room
          socket.to(gameRoom).emit('game-user-left', { id: socket.id });
        }
      } catch (error) {
        console.error("Error in leave-game:", error);
      }
    });

    socket.on('request-sit', ({ roomCode, seatId }) => {
      try {
        if (!socket.userId) return;
        const gameRoom = `game-${roomCode}`;
        if (socket.gameRoom !== gameRoom) return;
        
        const seatStr = String(seatId);
        if (!["0", "1", "2", "3"].includes(seatStr)) return;

        let seats = gameRoomSeats.get(roomCode);
        if (!seats) {
          seats = { "0": null, "1": null, "2": null, "3": null };
          gameRoomSeats.set(roomCode, seats);
        }

        if (seats[seatStr] !== null && seats[seatStr] !== socket.id) {
          socket.emit('seat-occupied', { seatId: parseInt(seatStr) });
          return;
        }

        const currentSeat = Object.keys(seats).find(k => seats[k] === socket.id);
        if (currentSeat && currentSeat !== seatStr) {
          seats[currentSeat] = null;
          io.in(gameRoom).emit('player-stood', { id: socket.id, seatId: parseInt(currentSeat) });
        }

        seats[seatStr] = socket.id;
        io.in(gameRoom).emit('player-sat', { id: socket.id, seatId: parseInt(seatStr) });
      } catch (error) {
        console.error("Error in request-sit:", error);
      }
    });

    socket.on('leave-seat', ({ roomCode }) => {
      try {
        if (!socket.userId) return;
        const gameRoom = `game-${roomCode}`;
        if (socket.gameRoom !== gameRoom) return;

        let seats = gameRoomSeats.get(roomCode);
        if (!seats) return;

        const currentSeat = Object.keys(seats).find(k => seats[k] === socket.id);
        if (currentSeat) {
          seats[currentSeat] = null;
          io.in(gameRoom).emit('player-stood', { id: socket.id, seatId: parseInt(currentSeat) });
        }
      } catch (error) {
        console.error("Error in leave-seat:", error);
      }
    });

    socket.on('game-player-update', ({ roomCode, position, rotation, state, animation }) => {
      const gameRoom = `game-${roomCode}`;
      if (socket.gameRoom === gameRoom) {
        socket.to(gameRoom).emit('game-player-update', { id: socket.id, position, rotation, state, animation });
      }
    });

    socket.on('game-gesture', ({ roomCode, gesture }) => {
      const gameRoom = `game-${roomCode}`;
      if (socket.gameRoom === gameRoom) {
        socket.to(gameRoom).emit('game-gesture', { id: socket.id, gesture });
      }
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected:', socket.id);
      if (socket.roomCode) {
        socket.to(socket.roomCode).emit('user-left', socket.id);
        // socket.leave(socket.roomCode);
        // delete socket.roomCode;
      }
      if (socket.gameRoom) {
        // Release any couch seat owned by that socket
        const roomCode = socket.gameRoom.split('-')[1];
        let seats = gameRoomSeats.get(roomCode);
        if (seats) {
          const currentSeat = Object.keys(seats).find(k => seats[k] === socket.id);
          if (currentSeat) {
            seats[currentSeat] = null;
            socket.to(socket.gameRoom).emit('player-stood', { id: socket.id, seatId: parseInt(currentSeat) });
          }
        }

        socket.to(socket.gameRoom).emit('game-user-left', { id: socket.id });
      }
    });
  })
  return io;
}
module.exports = initSocket;