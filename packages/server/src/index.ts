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

export default app;
export { GameRoom } from './room';
