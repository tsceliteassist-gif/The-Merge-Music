import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from './auth.js';
import { adminSupabase } from '../lib/supabase.js';

export function requireRole(roles: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { data, error } = await adminSupabase.from('user_roles').select('role').eq('user_id', req.user.id);
    if (error) return res.status(500).json({ error: 'Unable to verify role' });
    if (!data?.some(row => roles.includes(row.role))) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  };
}
