import type { GameRoom } from '../room';

declare module 'cloudflare:test' {
  interface ProvidedEnv {
    GAME_ROOM: DurableObjectNamespace<GameRoom>;
    AI: Ai;
    ANALYTICS: AnalyticsEngineDataset;
  }
}
