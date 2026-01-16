export type Phase =
  | 'lobby'
  | 'memory'
  | 'roles'
  | 'details'
  | 'questions'
  | 'voting'
  | 'results';

export type Role = 'witness' | 'imposter';

export type ConnectionStatus =
  | 'connected'
  | 'stale'
  | 'degraded'
  | 'dropped'
  | 'reconnecting';

export type VoiceStatus = 'muted' | 'speaking' | 'deafened' | 'disconnected';

export type GameState = 'idle' | 'lobby' | 'playing' | 'finished';

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  connectionStatus: ConnectionStatus;
  voiceStatus: VoiceStatus;
  score: number;
}

export interface RoomConfig {
  rounds: 3 | 5 | 7;
  timeScale: number;
  maxPlayers: number;
  witnessCount: 'auto' | 1 | 2;
  allowSpectators: boolean;
  voiceEnabled: boolean;
}

export interface RoundState {
  phase: Phase;
  round: number;
  totalRounds: number;
  players: Player[];
  spectators: Player[];
  timeRemaining: number;
}

export interface Question {
  id: string;
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  toPlayerName: string;
  question: string;
  answer?: string;
  timestamp: number;
}

export interface RoundResults {
  roundNumber: number;
  witnessIds: string[];
  witnessNames: string[];
  fragments: string[];
  votes: Record<string, string>;
  roundScores: Record<string, number>;
  totalScores: Record<string, number>;
}

export interface GameStats {
  bestBluff?: { id: string; name: string; votesReceived: number };
  bestDetective?: { id: string; name: string; correctGuesses: number };
  sneakiestWitness?: { id: string; name: string; timesUndetected: number };
}

export interface Winner {
  id: string;
  name: string;
  score: number;
}

export type ErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'INVALID_ACTION'
  | 'NOT_HOST'
  | 'GAME_IN_PROGRESS'
  | 'INVALID_PHASE'
  | 'RATE_LIMITED'
  | 'INVALID_SESSION'
  | 'INVALID_MESSAGE'
  | 'NAME_TAKEN';

export type LeaveReason = 'left' | 'kicked' | 'disconnected';

export type GameFinishedReason = 'completed' | 'insufficient_players' | 'host_ended';

export type RoundVoidReason = 'witness_disconnected';
