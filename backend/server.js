require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const routes = require('./routes/index');
const db = require('./models/Database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Tất cả routes
app.use('/api', routes);

// WebSocket handler
const activeUsers = {}; // Track connected users

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // User joins a chat room (appointment)
  socket.on('join_appointment', (data) => {
    const { appointmentId, userId } = data;
    const roomName = `appointment_${appointmentId}`;
    
    socket.join(roomName);
    activeUsers[socket.id] = { appointmentId, userId, roomName };
    console.log(`User ${userId} joined appointment ${appointmentId}`);
  });
  
  // Receive message and broadcast to room
  socket.on('send_message', async (data) => {
    const { appointmentId, content, messageId } = data;
    const roomName = `appointment_${appointmentId}`;
    
    console.log(`📨 [BACKEND] Received send_message event from ${socket.id}`);
    console.log(`   appointmentId: ${appointmentId}, messageId: ${messageId}`);
    
    try {
      // Fetch the newly created message from database with sender info
      const [messages] = await db.query(`
        SELECT m.*, u.username as sender_name, u.role as sender_role
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.appointment_id = ? AND m.id = ?
        LIMIT 1
      `, [appointmentId, messageId]);
      
      if (messages.length > 0) {
        const msg = messages[0];
        console.log(`✅ [BACKEND] Found message in DB:`, msg);
        console.log(`📤 [BACKEND] Broadcasting to room: ${roomName}`);
        
        // Broadcast complete message to all users in this appointment
        io.to(roomName).emit('receive_message', {
          id: msg.id,
          appointmentId,
          content: msg.content,
          sender_id: msg.sender_id,
          sender_name: msg.sender_name,
          sender_role: msg.sender_role,
          created_at: msg.created_at
        });
        
        console.log(`✅ [BACKEND] Message emitted to room ${roomName}`);
      } else {
        console.log(`❌ [BACKEND] Message not found in DB for id ${messageId}`);
      }
    } catch (error) {
      console.error('❌ [BACKEND] Error fetching message:', error);
    }
  });
  
  // User disconnects
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete activeUsers[socket.id];
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`EmotiLoom OOP Backend running on port ${PORT}`);
});