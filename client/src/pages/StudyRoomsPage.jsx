// import React, { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { io } from 'socket.io-client';
// import { Users, Send, LogOut, Plus, Hash } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';
// import toast from 'react-hot-toast';
// // import { v4 as uuidv4 } from 'uuid';

// const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'General'];
// const socketRef = { current: null };

// function RoomCard({ room, onJoin }) {
//   return (
//     <motion.div whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.2)' }}
//       className="glass border border-brand-border rounded-2xl p-5 cursor-pointer transition-all"
//       onClick={() => onJoin(room)}>
//       <div className="flex items-start justify-between mb-3">
//         <div className="w-10 h-10 rounded-xl bg-cyan/20 flex items-center justify-center text-lg">{room.emoji}</div>
//         <span className="text-xs font-semibold px-2 py-1 bg-neon-green/20 text-neon-green rounded-full flex items-center gap-1">
//           <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-blink" /> Live
//         </span>
//       </div>
//       <h3 className="font-syne font-bold text-base mb-1">{room.name}</h3>
//       <p className="text-xs text-white/40 mb-3">{room.subject}</p>
//       <div className="flex items-center justify-between text-xs text-white/30">
//         <div className="flex items-center gap-1.5"><Users size={11} /> {room.count} students</div>
//         <span>Join →</span>
//       </div>
//     </motion.div>
//   );
// }

// const DEMO_ROOMS = [
//   { id: 'room-math-001', name: 'Calculus Study Group', subject: 'Mathematics', emoji: '🧮', count: 4 },
//   { id: 'room-phys-001', name: 'Physics Problem Solving', subject: 'Physics', emoji: '⚡', count: 6 },
//   { id: 'room-cs-001',   name: 'DSA & Algorithms',       subject: 'Computer Science', emoji: '💻', count: 3 },
//   { id: 'room-chem-001', name: 'Organic Chemistry Help', subject: 'Chemistry', emoji: '⚗️', count: 2 },
// ];

// export default function StudyRoomsPage() {
//   const { user } = useAuth();
//   const [phase, setPhase]         = useState('browse'); // browse | room
//   const [currentRoom, setCurrentRoom] = useState(null);
//   const [messages, setMessages]   = useState([]);
//   const [participants, setParticipants] = useState([]);
//   const [input, setInput]         = useState('');
//   const [createOpen, setCreateOpen] = useState(false);
//   const [newRoom, setNewRoom]     = useState({ name: '', subject: SUBJECTS[0] });
//   const messagesEndRef = useRef(null);

//   useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

//   const initSocket = () => {
//     if (socketRef.current) return;
//     socketRef.current = io('/', { transports: ['websocket', 'polling'] });
//   };

//   const joinRoom = (room) => {
//     initSocket();
//     const socket = socketRef.current;

//     socket.emit('join-room', {
//       roomId:      room.id,
//       roomName:    room.name,
//       subject:     room.subject,
//       uid:         user.uid,
//       displayName: user.displayName || 'Student',
//     });

//     socket.on('room-joined', ({ participants: p }) => {
//       setParticipants(p);
//       setMessages([{ system: true, text: `You joined ${room.name}`, ts: new Date().toISOString() }]);
//     });
//     socket.on('room-update',  ({ participants: p }) => setParticipants(p));
//     socket.on('user-joined',  (d) => setMessages(m => [...m, { system: true, text: d.message, ts: d.timestamp }]));
//     socket.on('user-left',    (d) => setMessages(m => [...m, { system: true, text: d.message, ts: d.timestamp }]));
//     socket.on('new-message',  (d) => setMessages(m => [...m, d]));

//     setCurrentRoom(room);
//     setPhase('room');
//     toast.success(`Joined ${room.name}!`);
//   };

//   const leaveRoom = () => {
//     if (socketRef.current && currentRoom) {
//       socketRef.current.emit('leave-room', { roomId: currentRoom.id, displayName: user.displayName });
//       socketRef.current.off('room-joined');
//       socketRef.current.off('room-update');
//       socketRef.current.off('user-joined');
//       socketRef.current.off('user-left');
//       socketRef.current.off('new-message');
//     }
//     setPhase('browse');
//     setCurrentRoom(null);
//     setMessages([]);
//     setParticipants([]);
//   };

//   const sendMsg = () => {
//     if (!input.trim() || !socketRef.current) return;
//     socketRef.current.emit('room-message', {
//       roomId:      currentRoom.id,
//       message:     input.trim(),
//       displayName: user.displayName || 'Student',
//       uid:         user.uid,
//     });
//     setInput('');
//   };

//   const createRoom = () => {
//     if (!newRoom.name.trim()) { toast.error('Enter a room name'); return; }
//     const room = {
//       id:      `room-${uuidv4()}`,
//       name:    newRoom.name,
//       subject: newRoom.subject,
//       emoji:   '📚',
//       count:   0,
//     };
//     joinRoom(room);
//     setCreateOpen(false);
//     setNewRoom({ name: '', subject: SUBJECTS[0] });
//   };

//   /* BROWSE */
//   if (phase === 'browse') return (
//     <div className="p-6 lg:p-8">
//       <div className="flex items-center justify-between mb-8">
//         <div>
//           <h1 className="font-syne font-black text-3xl mb-1">Study Rooms</h1>
//           <p className="text-white/40 text-sm">Real-time collaborative learning with peers</p>
//         </div>
//         <button onClick={() => setCreateOpen(true)}
//           className="btn-cyan flex items-center gap-2 text-sm py-2.5">
//           <Plus size={16} /> Create Room
//         </button>
//       </div>

//       {/* Info banner */}
//       <div className="glass border border-cyan/20 rounded-2xl p-4 mb-6 flex gap-3 text-sm">
//         <div className="text-2xl">💡</div>
//         <div>
//           <p className="font-semibold text-cyan mb-0.5">How Study Rooms Work</p>
//           <p className="text-white/50 text-xs leading-relaxed">Join a room to chat in real-time with other students studying the same subject. Ask questions, share resources, and learn together. Rooms require the backend server to be running for real-time features.</p>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//         {DEMO_ROOMS.map(r => <RoomCard key={r.id} room={r} onJoin={joinRoom} />)}
//       </div>

//       {/* Create room modal */}
//       <AnimatePresence>
//         {createOpen && (
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
//             onClick={() => setCreateOpen(false)}>
//             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
//               onClick={e => e.stopPropagation()}
//               className="glass border border-brand-border2 rounded-2xl p-6 max-w-sm w-full">
//               <h2 className="font-syne font-bold text-xl mb-5">Create Study Room</h2>
//               <div className="space-y-4 mb-5">
//                 <div>
//                   <label className="text-xs font-medium text-white/50 mb-1.5 block">Room Name</label>
//                   <input value={newRoom.name} onChange={e => setNewRoom(r => ({ ...r, name: e.target.value }))}
//                     placeholder="e.g. JEE Physics Group" className="input-dark w-full" />
//                 </div>
//                 <div>
//                   <label className="text-xs font-medium text-white/50 mb-1.5 block">Subject</label>
//                   <select value={newRoom.subject} onChange={e => setNewRoom(r => ({ ...r, subject: e.target.value }))}
//                     className="input-dark w-full">
//                     {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
//                   </select>
//                 </div>
//               </div>
//               <div className="flex gap-3">
//                 <button onClick={() => setCreateOpen(false)} className="flex-1 btn-outline py-2.5 text-sm">Cancel</button>
//                 <button onClick={createRoom} className="flex-1 btn-cyan py-2.5 text-sm">Create & Join</button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );

//   /* ROOM CHAT */
//   return (
//     <div className="h-screen flex flex-col">
//       {/* Room header */}
//       <div className="flex items-center justify-between px-6 py-3.5 border-b border-brand-border bg-brand-bg2">
//         <div className="flex items-center gap-3">
//           <div className="w-9 h-9 rounded-xl bg-cyan/20 flex items-center justify-center text-lg">📚</div>
//           <div>
//             <p className="font-syne font-bold text-sm">{currentRoom?.name}</p>
//             <p className="text-xs text-white/40 flex items-center gap-1.5">
//               <Users size={10} /> {participants.length} online · {currentRoom?.subject}
//             </p>
//           </div>
//         </div>
//         <div className="flex items-center gap-3">
//           {/* Participants avatars */}
//           <div className="flex -space-x-2">
//             {participants.slice(0, 5).map((p, i) => (
//               <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan border-2 border-brand-bg2 flex items-center justify-center text-xs font-bold text-brand-bg">
//                 {(p.displayName || 'U')[0].toUpperCase()}
//               </div>
//             ))}
//           </div>
//           <button onClick={leaveRoom}
//             className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 glass border border-red-500/20 rounded-xl px-3 py-1.5 transition-all">
//             <LogOut size={13} /> Leave
//           </button>
//         </div>
//       </div>

//       {/* Messages */}
//       <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
//         <AnimatePresence initial={false}>
//           {messages.map((msg, i) => msg.system ? (
//             <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//               className="text-center text-xs text-white/25 py-1">
//               {msg.text}
//             </motion.div>
//           ) : (
//             <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
//               className={`flex gap-2.5 ${msg.uid === user.uid ? 'justify-end' : ''}`}>
//               {msg.uid !== user.uid && (
//                 <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-400 to-cyan flex items-center justify-center text-xs font-bold text-brand-bg flex-shrink-0">
//                   {(msg.displayName || 'U')[0].toUpperCase()}
//                 </div>
//               )}
//               <div className={`max-w-xs ${msg.uid === user.uid ? 'items-end' : 'items-start'} flex flex-col`}>
//                 {msg.uid !== user.uid && <p className="text-[10px] text-white/30 mb-1 ml-1">{msg.displayName}</p>}
//                 <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${msg.uid === user.uid ? 'bg-cyan text-brand-bg font-medium rounded-br-sm' : 'bg-white/[0.06] border border-white/[0.08] rounded-bl-sm'}`}>
//                   {msg.message}
//                 </div>
//               </div>
//             </motion.div>
//           ))}
//         </AnimatePresence>
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input */}
//       <div className="px-6 py-4 border-t border-brand-border bg-brand-bg2">
//         <div className="flex gap-3">
//           <input value={input} onChange={e => setInput(e.target.value)}
//             onKeyDown={e => e.key === 'Enter' && sendMsg()}
//             placeholder="Send a message to the room..."
//             className="input-dark flex-1 text-sm" />
//           <motion.button whileTap={{ scale: 0.92 }} onClick={sendMsg}
//             disabled={!input.trim()}
//             className="w-11 h-11 rounded-xl bg-cyan flex items-center justify-center text-brand-bg disabled:opacity-40">
//             <Send size={16} />
//           </motion.button>
//         </div>
//       </div>
//     </div>
//   );
// }


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Send, LogOut, Plus, Hash, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','Computer Science','General','History','Economics'];

const DEMO_ROOMS = [
  { id: 'room-math-001', name: 'Calculus Study Group',    subject: 'Mathematics',       emoji: '🧮', count: 4 },
  { id: 'room-phys-001', name: 'Physics Problem Solving', subject: 'Physics',            emoji: '⚡', count: 6 },
  { id: 'room-cs-001',   name: 'DSA & Algorithms',        subject: 'Computer Science',  emoji: '💻', count: 3 },
  { id: 'room-chem-001', name: 'Organic Chemistry Help',  subject: 'Chemistry',          emoji: '⚗️', count: 2 },
];

/* ── Local-only room store (works without backend) ── */
const LOCAL_KEY = 'brainnex-custom-rooms';
function loadCustomRooms() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch { return []; }
}
function saveCustomRooms(rooms) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(rooms));
}

function RoomCard({ room, onJoin }) {
  return (
    <motion.div whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.2)' }}
      className="glass border border-brand-border rounded-2xl p-5 cursor-pointer transition-all"
      onClick={() => onJoin(room)}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl bg-cyan/10 flex items-center justify-center text-xl">{room.emoji}</div>
        <span className="text-xs font-semibold px-2 py-1 bg-neon-green/20 text-neon-green rounded-full flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-blink" /> Live
        </span>
      </div>
      <h3 className="font-syne font-bold text-sm mb-1">{room.name}</h3>
      <p className="text-xs text-white/40 mb-3">{room.subject}</p>
      <div className="flex items-center justify-between text-xs text-white/30">
        <div className="flex items-center gap-1.5"><Users size={11} /> {room.count} students</div>
        <span className="text-cyan">Join →</span>
      </div>
    </motion.div>
  );
}

export default function StudyRoomsPage() {
  const { user } = useAuth();
  const [phase,           setPhase]           = useState('browse');
  const [currentRoom,     setCurrentRoom]     = useState(null);
  const [messages,        setMessages]        = useState([]);
  const [participants,    setParticipants]     = useState([]);
  const [input,           setInput]           = useState('');
  const [createOpen,      setCreateOpen]      = useState(false);
  const [newRoom,         setNewRoom]         = useState({ name: '', subject: SUBJECTS[0] });
  const [customRooms,     setCustomRooms]     = useState(loadCustomRooms);
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef      = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  /* ── Try connecting socket, but degrade gracefully ── */
  const connectSocket = useCallback(() => {
    try {
      const { io } = require('socket.io-client');
      const socket = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        timeout: 3000,
        reconnectionAttempts: 2,
      });
      socket.on('connect',    () => setSocketConnected(true));
      socket.on('disconnect', () => setSocketConnected(false));
      socket.on('connect_error', () => { setSocketConnected(false); });
      socketRef.current = socket;
    } catch {
      setSocketConnected(false);
    }
  }, []);

  const joinRoom = (room) => {
    // Try real-time socket if available
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-room', {
        roomId:      room.id,
        roomName:    room.name,
        subject:     room.subject,
        uid:         user.uid,
        displayName: user.displayName || 'Student',
      });
      socketRef.current.on('room-joined',  ({ participants: p }) => setParticipants(p));
      socketRef.current.on('room-update',  ({ participants: p }) => setParticipants(p));
      socketRef.current.on('user-joined',  d => setMessages(m => [...m, { system: true, text: d.message, ts: d.timestamp }]));
      socketRef.current.on('user-left',    d => setMessages(m => [...m, { system: true, text: d.message, ts: d.timestamp }]));
      socketRef.current.on('new-message',  d => setMessages(m => [...m, d]));
    }

    // Always set local state so room works even without backend
    setParticipants([{ uid: user.uid, displayName: user.displayName || 'You' }]);
    setMessages([{
      system: true,
      text: `You joined "${room.name}". ${socketConnected ? 'Real-time mode active.' : 'Running in local mode (start the backend server for real-time multiplayer).'}`,
      ts: new Date().toISOString(),
    }]);
    setCurrentRoom(room);
    setPhase('room');
    toast.success(`Joined ${room.name}!`);
  };

  const leaveRoom = () => {
    if (socketRef.current?.connected && currentRoom) {
      socketRef.current.emit('leave-room', { roomId: currentRoom.id, displayName: user.displayName });
      socketRef.current.off('room-joined');
      socketRef.current.off('room-update');
      socketRef.current.off('user-joined');
      socketRef.current.off('user-left');
      socketRef.current.off('new-message');
    }
    setPhase('browse');
    setCurrentRoom(null);
    setMessages([]);
    setParticipants([]);
  };

  const sendMsg = () => {
    if (!input.trim()) return;
    const msg = {
      uid:         user.uid,
      displayName: user.displayName || 'You',
      message:     input.trim(),
      timestamp:   new Date().toISOString(),
    };
    if (socketRef.current?.connected && currentRoom) {
      socketRef.current.emit('room-message', { roomId: currentRoom.id, ...msg });
    } else {
      // Local mode — just show your own message
      setMessages(m => [...m, msg]);
    }
    setInput('');
  };

  const createRoom = () => {
    if (!newRoom.name.trim()) { toast.error('Enter a room name'); return; }
    const emojis = { Mathematics:'🧮', Physics:'⚡', Chemistry:'⚗️', Biology:'🔬', 'Computer Science':'💻', General:'📚', History:'📜', Economics:'💰' };
    const room = {
      id:      `custom-${Date.now()}`,
      name:    newRoom.name.trim(),
      subject: newRoom.subject,
      emoji:   emojis[newRoom.subject] || '📚',
      count:   1,
      custom:  true,
    };
    const updated = [room, ...customRooms];
    setCustomRooms(updated);
    saveCustomRooms(updated);
    setCreateOpen(false);
    setNewRoom({ name: '', subject: SUBJECTS[0] });
    toast.success('Room created!');
    joinRoom(room);
  };

  const deleteCustomRoom = (e, roomId) => {
    e.stopPropagation();
    const updated = customRooms.filter(r => r.id !== roomId);
    setCustomRooms(updated);
    saveCustomRooms(updated);
    toast.success('Room deleted');
  };

  const allRooms = [...customRooms, ...DEMO_ROOMS];

  /* ── BROWSE ── */
  if (phase === 'browse') return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-syne font-black text-3xl mb-1">Study Rooms</h1>
          <p className="text-white/40 text-sm">Real-time collaborative learning with peers</p>
        </div>
        <button onClick={() => { connectSocket(); setCreateOpen(true); }}
          className="btn-cyan flex items-center gap-2 text-sm py-2.5">
          <Plus size={16} /> Create Room
        </button>
      </div>

      {/* Backend status */}
      <div className={`flex items-center gap-2.5 rounded-2xl p-3.5 mb-5 text-xs border ${
        socketConnected
          ? 'bg-neon-green/10 border-neon-green/20 text-neon-green'
          : 'bg-white/[0.04] border-brand-border text-white/40'}`}>
        {socketConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
        <span>
          {socketConnected
            ? 'Real-time server connected — multiplayer active!'
            : 'Backend server not detected. Rooms work in local mode. Start server for real-time multiplayer.'}
        </span>
        {!socketConnected && (
          <button onClick={connectSocket}
            className="ml-auto text-cyan hover:underline flex-shrink-0">Connect</button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {allRooms.map(r => (
          <div key={r.id} className="relative group">
            <RoomCard room={r} onJoin={joinRoom} />
            {r.custom && (
              <button onClick={e => deleteCustomRoom(e, r.id)}
                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg px-2 py-0.5 hover:bg-red-500/30">
                Delete
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Create room modal */}
      <AnimatePresence>
        {createOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setCreateOpen(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="glass border border-brand-border2 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h2 className="font-syne font-bold text-xl mb-1">Create Study Room</h2>
              <p className="text-xs text-white/40 mb-5">Your room will be saved and visible to you</p>
              <div className="space-y-4 mb-5">
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Room Name</label>
                  <input value={newRoom.name}
                    onChange={e => setNewRoom(r => ({ ...r, name: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && createRoom()}
                    placeholder="e.g. JEE Physics Group" className="input-dark w-full" autoFocus />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Subject</label>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECTS.map(s => (
                      <button key={s} onClick={() => setNewRoom(r => ({ ...r, subject: s }))}
                        className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${
                          s === newRoom.subject ? 'bg-cyan/20 border-cyan/40 text-cyan' : 'border-brand-border text-white/40 hover:border-brand-border2'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setCreateOpen(false)} className="flex-1 btn-outline py-2.5 text-sm">Cancel</button>
                <button onClick={createRoom} className="flex-1 btn-cyan py-2.5 text-sm">Create & Join →</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  /* ── ROOM CHAT ── */
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-brand-border bg-brand-bg2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan/10 flex items-center justify-center text-lg">{currentRoom?.emoji}</div>
          <div>
            <p className="font-syne font-bold text-sm">{currentRoom?.name}</p>
            <p className="text-xs text-white/40 flex items-center gap-1.5">
              <Users size={10} /> {participants.length} online · {currentRoom?.subject}
              {socketConnected
                ? <span className="text-neon-green">· Live</span>
                : <span className="text-neon-amber">· Local mode</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Participant avatars */}
          <div className="flex -space-x-2">
            {participants.slice(0, 4).map((p, i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-brand-bg2 flex items-center justify-center text-xs font-bold text-brand-bg"
                style={{ background: 'linear-gradient(135deg, #a78bfa, #00e5ff)' }}>
                {(p.displayName || 'U')[0].toUpperCase()}
              </div>
            ))}
          </div>
          <button onClick={leaveRoom}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 glass border border-red-500/20 rounded-xl px-3 py-1.5 transition-all">
            <LogOut size={13} /> Leave
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) =>
            msg.system ? (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center text-xs text-white/25 py-1">{msg.text}</motion.div>
            ) : (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2.5 ${msg.uid === user.uid ? 'justify-end' : ''}`}>
                {msg.uid !== user.uid && (
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold text-brand-bg flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #a78bfa, #00e5ff)' }}>
                    {(msg.displayName || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className={`max-w-xs flex flex-col ${msg.uid === user.uid ? 'items-end' : 'items-start'}`}>
                  {msg.uid !== user.uid && (
                    <p className="text-[10px] text-white/30 mb-1 ml-1">{msg.displayName}</p>
                  )}
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${
                    msg.uid === user.uid
                      ? 'bg-cyan text-brand-bg font-medium rounded-br-sm'
                      : 'bg-white/[0.06] border border-white/[0.08] rounded-bl-sm'}`}>
                    {msg.message}
                  </div>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-brand-border bg-brand-bg2 flex-shrink-0">
        <div className="flex gap-3">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMsg()}
            placeholder="Send a message..."
            className="input-dark flex-1 text-sm" />
          <motion.button whileTap={{ scale: 0.92 }} onClick={sendMsg} disabled={!input.trim()}
            className="w-10 h-10 rounded-xl bg-cyan flex items-center justify-center text-brand-bg disabled:opacity-40 transition-all">
            <Send size={15} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
