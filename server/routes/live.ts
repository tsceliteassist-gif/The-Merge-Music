import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { adminSupabase } from '../lib/supabase.js';
import { createLiveKitToken } from '../services/livekit.js';

const router = Router();
const tokenSchema = z.object({ roomId: z.string().uuid() });

router.post('/token', requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = tokenSchema.safeParse(req.body);
  if (!parsed.success || !req.user) return res.status(400).json({ error: 'Valid roomId required' });
  const { data: room } = await adminSupabase.from('live_rooms').select('id,host_id,livekit_room_name,status').eq('id', parsed.data.roomId).single();
  if (!room || room.status === 'ended') return res.status(404).json({ error: 'Live room not available' });
  const { data: roles } = await adminSupabase.from('user_roles').select('role').eq('user_id', req.user.id);
  const broadcaster = roles?.some(r => ['master_admin', 'admin'].includes(r.role)) ?? false;
  const canPublish = room.host_id === req.user.id || broadcaster;
  const token = await createLiveKitToken({ identity: req.user.id, roomName: room.livekit_room_name, canPublish });
  res.json({ token, url: process.env.LIVEKIT_URL, canPublish });
});

export default router;
