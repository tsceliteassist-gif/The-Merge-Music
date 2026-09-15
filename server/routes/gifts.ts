import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { sensitiveLimiter } from '../middleware/rateLimit.js';
import { adminSupabase } from '../lib/supabase.js';

const router = Router();
const schema = z.object({ roomId: z.string().uuid(), receiverId: z.string().uuid(), giftId: z.string().uuid(), quantity: z.number().int().min(1).max(100).default(1) });

router.post('/send', sensitiveLimiter, requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || !req.user) return res.status(400).json({ error: 'Invalid gift request' });
  const { data, error } = await adminSupabase.rpc('send_gift_transaction', {
    p_sender_id: req.user.id,
    p_receiver_id: parsed.data.receiverId,
    p_room_id: parsed.data.roomId,
    p_gift_id: parsed.data.giftId,
    p_quantity: parsed.data.quantity,
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, transaction: data });
});

export default router;
