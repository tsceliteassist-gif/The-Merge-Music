import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { sensitiveLimiter } from '../middleware/rateLimit.js';
import { adminSupabase } from '../lib/supabase.js';

const router = Router();
const createSchema = z.object({ reportedUserId: z.string().uuid().optional(), roomId: z.string().uuid().optional(), reason: z.string().min(3).max(120), details: z.string().max(2000).optional() });
const updateSchema = z.object({ status: z.enum(['open', 'reviewing', 'resolved', 'dismissed']) });

router.post('/', sensitiveLimiter, requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success || !req.user) return res.status(400).json({ error: 'Invalid report' });
  const { data, error } = await adminSupabase.from('reports').insert({ reporter_id: req.user.id, reported_user_id: parsed.data.reportedUserId, room_id: parsed.data.roomId, reason: parsed.data.reason, details: parsed.data.details }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

router.get('/', requireAuth, requireRole(['master_admin', 'admin', 'moderator']), async (_req, res) => {
  const { data, error } = await adminSupabase.from('reports').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.patch('/:id', requireAuth, requireRole(['master_admin', 'admin', 'moderator']), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid report status' });
  const { data, error } = await adminSupabase.from('reports').update({ status: parsed.data.status, resolved_at: ['resolved', 'dismissed'].includes(parsed.data.status) ? new Date().toISOString() : null }).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;
