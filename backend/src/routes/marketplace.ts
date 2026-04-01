import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all marketplace items
router.get('/', async (req, res) => {
  try {
    const items = await prisma.marketplaceItem.findMany({
      include: { owner: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Get a single marketplace item
router.get('/:id', async (req, res) => {
  try {
    const item = await prisma.marketplaceItem.findUnique({
      where: { id: req.params.id },
      include: { owner: { select: { id: true, name: true, avatar: true } } }
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Create a new marketplace item
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, description, price, condition, category, images } = req.body;
    
    const newItem = await prisma.marketplaceItem.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        condition,
        category,
        images: JSON.stringify(images || []),
        ownerId: req.user!.id
      }
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update item status (Mark as Sold / Active)
router.patch('/:id/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const item = await prisma.marketplaceItem.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.ownerId !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });
    const updated = await prisma.marketplaceItem.update({
      where: { id: req.params.id },
      data: { condition: req.body.status === 'sold' ? 'Sold' : item.condition }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item status' });
  }
});

export default router;
