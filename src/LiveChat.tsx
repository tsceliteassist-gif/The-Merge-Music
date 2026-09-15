import { FormEvent, useEffect, useMemo, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_URL } from './lib/api';
import { supabase } from './lib/supabase';

type ChatMessage = { id: string; userId: string; username: string; message: string; created_at: string };

export default function LiveChat({ roomId, socket }: { roomId: string; socket: Socket | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    supabase.from('live_chat_public').select('*').eq('room_id', roomId).order('created_at').limit(100).then(({ data }) => setMessages((data ?? []).map((row: any) => ({ id: String(row.id), userId: row.user_id, username: row.username ?? 'member', message: row.message, created_at: row.created_at }))));
  }, [roomId]);
  useEffect(() => {
    if (!socket) return;
    const receive = (incoming: ChatMessage) => setMessages(previous => previous.some(m => m.id === String(incoming.id)) ? previous : [...previous, { ...incoming, id: String(incoming.id) }]);
    socket.on('chat-message', receive);
    return () => { socket.off('chat-message', receive); };
  }, [socket]);
  function submit(e: FormEvent) {
    e.preventDefault(); const clean = message.trim(); if (!clean || !socket) return;
    socket.emit('chat-message', { roomId, message: clean }, (result: { error?: string }) => { if (result?.error) setNotice(result.error); else { setMessage(''); setNotice(''); } });
  }
  return <section className="live-chat"><div className="chat-messages">{messages.map(item => <p key={item.id}><b>@{item.username}</b> {item.message}</p>)}</div><form className="composer" onSubmit={submit}><input maxLength={500} value={message} onChange={e => setMessage(e.target.value)} placeholder="Say something…"/><button>Send</button></form>{notice && <p className="notice">{notice}</p>}</section>;
}

export function useRoomSocket(roomId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const instance = useMemo(() => API_URL ? io(API_URL, { autoConnect: false, transports: ['websocket'] }) : null, []);
  useEffect(() => {
    if (!instance) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active || !data.session) return;
      instance.auth = { token: data.session.access_token };
      instance.connect(); instance.emit('join-room', roomId); setSocket(instance);
    });
    instance.on('presence-count', setViewerCount);
    return () => { active = false; instance.emit('leave-room', roomId); instance.off('presence-count', setViewerCount); instance.disconnect(); setSocket(null); };
  }, [instance, roomId]);
  return { socket, viewerCount };
}
