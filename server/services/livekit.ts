import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { env } from '../config.js';

export async function createLiveKitToken(input: { identity: string; roomName: string; canPublish: boolean }) {
  const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, { identity: input.identity });
  token.addGrant({ roomJoin: true, room: input.roomName, canPublish: input.canPublish, canSubscribe: true });
  return token.toJwt();
}

export const roomService = new RoomServiceClient(env.LIVEKIT_URL, env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET);
