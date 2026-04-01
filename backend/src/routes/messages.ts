import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get conversation history with a specific user
router.get('/:userId', authenticate, async (req: AuthRequest, res) => {
  try {
    const currentUserId = req.user!.id;
    const otherUserId = req.params.userId;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Post a message (mostly we will use Socket.io, but this is a fallback)
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user!.id;

    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        receiverId
      }
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get all users who have chatted with the current user
router.get('/chat/users', authenticate, async (req: AuthRequest, res) => {
  try {
     const currentUserId = req.user!.id;
     
     // Find all messages where user is sender or receiver
     const messages = await prisma.message.findMany({
       where: {
         OR: [{ senderId: currentUserId }, { receiverId: currentUserId }]
       },
       include: {
         sender: { select: { id: true, name: true, avatar: true } },
         receiver: { select: { id: true, name: true, avatar: true } }
       },
       orderBy: { createdAt: 'desc' }
     });

     // Extract unique users
     const usersMap = new Map();
     messages.forEach(msg => {
        const otherUser = msg.senderId === currentUserId ? msg.receiver : msg.sender;
        if (!usersMap.has(otherUser.id)) {
           usersMap.set(otherUser.id, otherUser);
        }
     });

     res.json(Array.from(usersMap.values()));
  } catch(error) {
     res.status(500).json({ error: 'Failed to fetch chat contacts' });
  }
});

export default router;
