export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const PLAYER_NAME_MIN = 1;
export const PLAYER_NAME_MAX = 20;
export const PLAYER_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 8;

export const DETAIL_MAX_LENGTH = 280;
export const QUESTION_MAX_LENGTH = 200;
export const ANSWER_MAX_LENGTH = 200;

export const PHASE_DURATIONS = {
  memory: 5000,
  roles: 5000,
  details: 45000,
  questions: 90000,
  voting: 30000,
  results: 10000,
} as const;

export const HEARTBEAT_INTERVAL = 2000;
export const STALE_THRESHOLD = 3000;
export const DEGRADED_THRESHOLD = 10000;
export const DROPPED_THRESHOLD = 30000;

export const LOBBY_TIMEOUT = 30 * 60 * 1000;
export const FINISHED_TIMEOUT = 5 * 60 * 1000;

export const RATE_LIMIT_MAX = 10;
export const RATE_LIMIT_WINDOW = 1000;
export const RATE_LIMIT_BAN_DURATION = 30000;

export const VOTE_CALL_THRESHOLD = 0.5;

export const DEFAULT_CONFIG = {
  rounds: 5,
  timeScale: 1.0,
  maxPlayers: 6,
  witnessCount: 'auto',
  allowSpectators: true,
  voiceEnabled: true,
} as const;

export const AUTO_SUBMIT_TEXT = '[Lost in thought...]';
export const AUTO_ANSWER_TEXT = '...';
