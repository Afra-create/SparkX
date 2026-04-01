import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { prisma } from './db';
import authRoutes from './routes/auth';
import marketplaceRoutes from './routes/marketplace';
import lostFoundRoutes from './routes/lostfound';
import messageRoutes from './routes/messages';
import jwt from 'jsonwebtoken';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Allow all origins for the hackathon dashboard
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'] // Explicitly fallback if needed
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_secret';

// Middleware
app.use(cors({ origin: true, credentials: true })); // Allow all with credentials for the hackathon
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/messages', messageRoutes);

// User retrieval route for generic fetching
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, avatar: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, avatar: true }
    });
    res.json(users);
  } catch(err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Socket.io for Real-time chat
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  try {
    const user = jwt.verify(token, JWT_SECRET) as { id: string };
    socket.data.userId = user.id;
    next();
  } catch(err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.data.userId}`);
  
  // Join personal room to receive messages
  socket.join(socket.data.userId);

  socket.on('sendMessage', async (data) => {
    try {
      const { receiverId, content } = data;
      const senderId = socket.data.userId;

      const msg = await prisma.message.create({
        data: {
          content,
          senderId,
          receiverId
        },
        include: { sender: { select: { id: true, name: true, avatar: true } } }
      });

      // Emit to receiver and sender
      io.to(receiverId).emit('receiveMessage', msg);
      socket.emit('receiveMessage', msg);
    } catch(err) {
      console.error(err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.data.userId}`);
  });
});

httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Campus Nexus Backend is LIVE on all interfaces at PORT ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
});
