// require('dotenv').config();
// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const cors = require('cors');
// const admin = require('firebase-admin');

// // Initialize Firebase Admin
// admin.initializeApp({
//   credential: admin.credential.cert({
//     projectId: process.env.FIREBASE_PROJECT_ID,
//     privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
//     clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//   }),
// });

// const app = express();
// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: process.env.CLIENT_URL || 'http://localhost:5173',
//     methods: ['GET', 'POST'],
//   },
// });

// // Middleware
// app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
// app.use(express.json());

// // Routes
// app.use('/api/ai', require('./routes/ai'));
// app.use('/api/progress', require('./routes/progress'));

// app.get('/api/health', (req, res) => {
//   res.json({ status: 'BrainNex server running', timestamp: new Date().toISOString() });
// });

// // ─── Socket.io Study Rooms ────────────────────────────────────────────────────
// const rooms = new Map(); // roomId → { name, subject, participants: Map<socketId, {uid, name}> }

// io.on('connection', (socket) => {
//   console.log('Socket connected:', socket.id);

//   socket.on('join-room', ({ roomId, roomName, subject, uid, displayName }) => {
//     socket.join(roomId);

//     if (!rooms.has(roomId)) {
//       rooms.set(roomId, { name: roomName, subject, participants: new Map() });
//     }
//     const room = rooms.get(roomId);
//     room.participants.set(socket.id, { uid, displayName });

//     const participantsList = Array.from(room.participants.values());
//     io.to(roomId).emit('room-update', { participants: participantsList });

//     socket.to(roomId).emit('user-joined', {
//       displayName,
//       message: `${displayName} joined the room`,
//       timestamp: new Date().toISOString(),
//     });

//     socket.emit('room-joined', {
//       roomId,
//       participants: participantsList,
//     });
//   });

//   socket.on('room-message', ({ roomId, message, displayName, uid }) => {
//     io.to(roomId).emit('new-message', {
//       uid,
//       displayName,
//       message,
//       timestamp: new Date().toISOString(),
//       socketId: socket.id,
//     });
//   });

//   socket.on('whiteboard-draw', ({ roomId, data }) => {
//     socket.to(roomId).emit('whiteboard-update', data);
//   });

//   socket.on('leave-room', ({ roomId, displayName }) => {
//     handleLeaveRoom(socket, roomId, displayName);
//   });

//   socket.on('disconnect', () => {
//     rooms.forEach((room, roomId) => {
//       if (room.participants.has(socket.id)) {
//         const user = room.participants.get(socket.id);
//         handleLeaveRoom(socket, roomId, user?.displayName || 'Someone');
//       }
//     });
//     console.log('Socket disconnected:', socket.id);
//   });
// });

// function handleLeaveRoom(socket, roomId, displayName) {
//   socket.leave(roomId);
//   const room = rooms.get(roomId);
//   if (room) {
//     room.participants.delete(socket.id);
//     const participantsList = Array.from(room.participants.values());
//     io.to(roomId).emit('room-update', { participants: participantsList });
//     io.to(roomId).emit('user-left', {
//       displayName,
//       message: `${displayName} left the room`,
//       timestamp: new Date().toISOString(),
//     });
//     if (room.participants.size === 0) rooms.delete(roomId);
//   }
// }

// // ─── Export io for use in routes ─────────────────────────────────────────────
// app.set('io', io);

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`\n🧠 BrainNex server running on port ${PORT}`);
//   console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
// });

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');

// ─── Firebase Admin Init ───────────────────────────────────────────────
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

const app = express();
const server = http.createServer(app);

// ─── CORS FIX (IMPORTANT FOR VERCEL + RENDER) ──────────────────────────
const allowedOrigin =
  process.env.CLIENT_URL || 'https://brain-nex-ten.vercel.app/';

app.use(cors({
  origin: "*", // 🔥 allow all (safe for now)
}));

app.use(express.json());

// ─── SOCKET.IO SETUP ───────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST'],
  },
});

// ─── ROUTES ────────────────────────────────────────────────────────────
app.use('/api/ai', require('./routes/ai'));
app.use('/api/progress', require('./routes/progress'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'BrainNex server running',
    timestamp: new Date().toISOString(),
  });
});

// ─── SOCKET.IO STUDY ROOMS ─────────────────────────────────────────────
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join-room', ({ roomId, roomName, subject, uid, displayName }) => {
    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, { name: roomName, subject, participants: new Map() });
    }

    const room = rooms.get(roomId);
    room.participants.set(socket.id, { uid, displayName });

    const participantsList = Array.from(room.participants.values());

    io.to(roomId).emit('room-update', { participants: participantsList });

    socket.to(roomId).emit('user-joined', {
      displayName,
      message: `${displayName} joined the room`,
      timestamp: new Date().toISOString(),
    });

    socket.emit('room-joined', {
      roomId,
      participants: participantsList,
    });
  });

  socket.on('room-message', ({ roomId, message, displayName, uid }) => {
    io.to(roomId).emit('new-message', {
      uid,
      displayName,
      message,
      timestamp: new Date().toISOString(),
      socketId: socket.id,
    });
  });

  socket.on('whiteboard-draw', ({ roomId, data }) => {
    socket.to(roomId).emit('whiteboard-update', data);
  });

  socket.on('leave-room', ({ roomId, displayName }) => {
    handleLeaveRoom(socket, roomId, displayName);
  });

  socket.on('disconnect', () => {
    rooms.forEach((room, roomId) => {
      if (room.participants.has(socket.id)) {
        const user = room.participants.get(socket.id);
        handleLeaveRoom(socket, roomId, user?.displayName || 'Someone');
      }
    });
    console.log('Socket disconnected:', socket.id);
  });
});

function handleLeaveRoom(socket, roomId, displayName) {
  socket.leave(roomId);

  const room = rooms.get(roomId);
  if (room) {
    room.participants.delete(socket.id);

    const participantsList = Array.from(room.participants.values());

    io.to(roomId).emit('room-update', { participants: participantsList });

    io.to(roomId).emit('user-left', {
      displayName,
      message: `${displayName} left the room`,
      timestamp: new Date().toISOString(),
    });

    if (room.participants.size === 0) {
      rooms.delete(roomId);
    }
  }
}

// ─── EXPORT SOCKET.IO ──────────────────────────────────────────────────
app.set('io', io);

// ─── PORT FIX FOR RENDER ───────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🧠 BrainNex server running on port ${PORT}`);
});