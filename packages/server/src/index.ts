import { Hono } from 'hono';
import { cors } from 'hono/cors';
import * as Sentry from '@sentry/cloudflare';
import { ROOM_CODE_CHARS, ROOM_CODE_LENGTH } from '@dejavu/shared';
import type { GameRoom } from './room';

export interface Env {
  GAME_ROOM: DurableObjectNamespace<GameRoom>;
  AI: Ai;
  ANALYTICS: AnalyticsEngineDataset;
  CALLS_APP_ID: string;
  CALLS_APP_SECRET: string;
  SENTRY_DSN: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

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

  return stub.fetch(c.req.raw);
});

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 0.1,
  }),
  app
);
export { GameRoom } from './room';
