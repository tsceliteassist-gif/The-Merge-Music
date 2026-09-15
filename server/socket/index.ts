import type { Server, Socket } from 'socket.io';
import { z } from 'zod';
import { adminSupabase } from '../lib/supabase.js';

const roomSchema = z.string().uuid();
const messageSchema = z.object({ roomId: z.string().uuid(), message: z.string().trim().min(1).max(500) });
const giftSchema = z.object({ roomId: z.string().uuid(), transactionId: z.string().uuid() });

type AuthedSocket = Socket & { data: { userId?: string; username?: string } };

export function installSocketHandlers(io: Server) {
  io.use(async (socket: AuthedSocket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== 'string') return next(new Error('Authentication required'));
    const { data, error } = await adminSupabase.auth.getUser(token);
    if (error || !data.user) return next(new Error('Invalid authentication'));
    const { data: profile } = await adminSupabase.from('profiles').select('username').eq('id', data.user.id).maybeSingle();
    socket.data.userId = data.user.id;
    socket.data.username = profile?.username ?? 'member';
    next();
  });

  io.on('connection', (socket: AuthedSocket) => {
    socket.on('join-room', async (raw, acknowledge) => {
      const parsed = roomSchema.safeParse(raw);
      if (!parsed.success) return acknowledge?.({ error: 'Invalid room' });
      const { data: room } = await adminSupabase.from('live_rooms').select('id').eq('id', parsed.data).eq('status', 'live').maybeSingle();
      if (!room) return acknowledge?.({ error: 'Room is not live' });
      socket.join(parsed.data);
      acknowledge?.({ ok: true });
      io.to(parsed.data).emit('presence-count', io.sockets.adapter.rooms.get(parsed.data)?.size ?? 0);
    });
    socket.on('leave-room', raw => {
      const parsed = roomSchema.safeParse(raw);
      if (parsed.success) { socket.leave(parsed.data); io.to(parsed.data).emit('presence-count', io.sockets.adapter.rooms.get(parsed.data)?.size ?? 0); }
    });
    socket.on('chat-message', async (raw, acknowledge) => {
      const parsed = messageSchema.safeParse(raw);
      if (!parsed.success || !socket.data.userId) return acknowledge?.({ error: 'Invalid message' });
      if (!socket.rooms.has(parsed.data.roomId)) return acknowledge?.({ error: 'Join the room before chatting' });
      const { data, error } = await adminSupabase.from('live_chat').insert({ room_id: parsed.data.roomId, user_id: socket.data.userId, message: parsed.data.message }).select('id,message,created_at').single();
      if (error) return acknowledge?.({ error: error.message });
      io.to(parsed.data.roomId).emit('chat-message', { ...data, userId: socket.data.userId, username: socket.data.username });
      acknowledge?.({ ok: true });
    });
    socket.on('gift-sent', async (raw, acknowledge) => {
      const parsed = giftSchema.safeParse(raw);
      if (!parsed.success || !socket.data.userId) return acknowledge?.({ error: 'Invalid gift event' });
      const { data } = await adminSupabase.from('gift_transactions').select('id,room_id,sender_id,receiver_id,gift_id,coin_amount,gift_catalog(name,icon)').eq('id', parsed.data.transactionId).eq('sender_id', socket.data.userId).eq('room_id', parsed.data.roomId).maybeSingle();
      if (!data) return acknowledge?.({ error: 'Gift not verified' });
      io.to(parsed.data.roomId).emit('gift-animation', data);
      acknowledge?.({ ok: true });
    });
    socket.on('disconnecting', () => {
      for (const room of socket.rooms) if (room !== socket.id) queueMicrotask(() => io.to(room).emit('presence-count', io.sockets.adapter.rooms.get(room)?.size ?? 0));
    });
  });
}
