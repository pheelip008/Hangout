const { Server } = require('socket.io');
const cookie = require("cookie");
const { CLIENT_ORIGIN } = require('./network');



const jwt = require('jsonwebtoken');
const prisma = require("../../prisma/prisma")


function initSocket(server) {
  const io = new Server(server,
    {
      cors: {
        origin: CLIENT_ORIGIN,
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

    socket.on('disconnect', () => {
      console.log('A user disconnected:', socket.id);
      if (socket.roomCode) {
        socket.to(socket.roomCode).emit('user-left', socket.id);
        // socket.leave(socket.roomCode);
        // delete socket.roomCode;
      }
    });
  })
  return io;
}
module.exports = initSocket;