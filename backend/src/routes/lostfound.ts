import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all lost & found items
router.get('/', async (req, res) => {
  try {
    const items = await prisma.lostFoundItem.findMany({
      include: { owner: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lost/found items' });
  }
});

// Create a new lost/found item
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, description, location, date, type, images } = req.body;
    
    const newItem = await prisma.lostFoundItem.create({
      data: {
        title,
        description,
        location,
        type: (type || 'LOST').toUpperCase(),  // normalize to uppercase
        date,
        images: JSON.stringify(images || []),
        status: 'ACTIVE',
        ownerId: req.user!.id
      }
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create lost/found item' });
  }
});

// Update lost/found item status (Mark as Resolved)
router.patch('/:id/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const item = await prisma.lostFoundItem.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.ownerId !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });
    const updated = await prisma.lostFoundItem.update({
      where: { id: req.params.id },
      data: { status: req.body.status || 'resolved' }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;
