import { useEffect, useState } from 'react';
import { LiveKitRoom, RoomAudioRenderer, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import type { LiveRoom as LiveRoomRecord } from './types';
import { apiFetch } from './lib/api';
import LiveChat, { useRoomSocket } from './LiveChat';
import GiftPanel from './GiftPanel';

type TokenResponse = { token: string; url: string; canPublish: boolean };

export default function LiveRoomExperience({ room }: { room: LiveRoomRecord }) {
  const [connection, setConnection] = useState<TokenResponse | null>(null);
  const [error, setError] = useState('');
  const [gifting, setGifting] = useState(false);
  const { socket, viewerCount } = useRoomSocket(room.id);
  useEffect(() => { apiFetch<TokenResponse>('/api/live/token', { method: 'POST', body: JSON.stringify({ roomId: room.id }) }).then(setConnection).catch(error => setError(error.message)); }, [room.id]);
  if (error) return <p className="notice">{error}</p>;
  if (!connection) return <p>Connecting to The MERGE…</p>;
  return <section><div className="status"><span className="on"/><b>{room.title}</b><small>{viewerCount} viewer{viewerCount === 1 ? '' : 's'}</small></div><div className="live-stage"><LiveKitRoom token={connection.token} serverUrl={connection.url} connect video={connection.canPublish} audio={connection.canPublish}><VideoConference/><RoomAudioRenderer/></LiveKitRoom></div><button onClick={() => setGifting(true)}>Send a gift</button><LiveChat roomId={room.id} socket={socket}/>{gifting && <GiftPanel roomId={room.id} recipientId={room.host_id} onClose={() => setGifting(false)} onSent={id => socket?.emit('gift-sent', { roomId: room.id, transactionId: id })}/>}</section>;
}
