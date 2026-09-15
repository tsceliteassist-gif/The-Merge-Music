import type { NextFunction, Request, Response } from 'express';
import { adminSupabase } from '../lib/supabase.js';

export type AuthenticatedRequest = Request & { user?: { id: string; email?: string } };

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
  const { data, error } = await adminSupabase.auth.getUser(header.slice(7));
  if (error || !data.user) return res.status(401).json({ error: 'Invalid authentication' });
  req.user = { id: data.user.id, email: data.user.email };
  next();
}
