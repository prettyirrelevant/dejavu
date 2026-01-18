import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ROOM_CODE_CHARS, ROOM_CODE_LENGTH } from '@dejavu/shared';
import type { GameRoom } from './room';

export interface Env {
  GAME_ROOM: DurableObjectNamespace<GameRoom>;
  ANALYTICS: AnalyticsEngineDataset;
  GEMINI_API_KEY: string;
  DAILY_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: ['http://localhost:5173', 'https://dejavu.enio.la'],
  credentials: true,
}));

function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() });
});

app.post('/rooms', async (c) => {
  const roomCode = generateRoomCode();
  const id = c.env.GAME_ROOM.idFromName(roomCode);
  const stub = c.env.GAME_ROOM.get(id);

  await stub.initialize(roomCode);

  return c.json({ roomCode }, 201);
});

app.get('/rooms/:code', async (c) => {
  const roomCode = c.req.param('code').toUpperCase();

  if (roomCode.length !== ROOM_CODE_LENGTH) {
    return c.json({ error: 'Invalid room code' }, 400);
  }

  const upgradeHeader = c.req.header('Upgrade');
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return c.json({ error: 'Expected WebSocket upgrade' }, 426);
  }

  const id = c.env.GAME_ROOM.idFromName(roomCode);
  const stub = c.env.GAME_ROOM.get(id);

  await stub.initialize(roomCode);

  return stub.fetch(c.req.raw);
});

app.post('/voice/:roomCode', async (c) => {
  const roomCode = c.req.param('roomCode').toUpperCase();
  
  if (!c.env.DAILY_API_KEY) {
    return c.json({ error: 'Voice chat not configured' }, 503);
  }

  const dailyRoomName = `dejavu-${roomCode.toLowerCase()}`;

  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${c.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: dailyRoomName,
      properties: {
        exp: Math.floor(Date.now() / 1000) + 3600,
        enable_chat: false,
        enable_screenshare: false,
        start_video_off: true,
        start_audio_off: false,
      },
    }),
  });

  if (!response.ok) {
    const existing = await fetch(`https://api.daily.co/v1/rooms/${dailyRoomName}`, {
      headers: { 'Authorization': `Bearer ${c.env.DAILY_API_KEY}` },
    });
    
    if (existing.ok) {
      const room = await existing.json() as { url: string; name: string };
      return c.json({ url: room.url, name: room.name });
    }
    
    return c.json({ error: 'Failed to create voice room' }, 500);
  }

  const room = await response.json() as { url: string; name: string };
  return c.json({ url: room.url, name: room.name });
});

export default app;
export { GameRoom } from './room';
