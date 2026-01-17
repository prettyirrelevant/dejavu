import { createStore } from 'solid-js/store';
import type { Phase, Player, Role, RoomConfig } from '@dejavu/shared';

interface GameStore {
  phase: Phase;
  round: number;
  totalRounds: number;
  players: Player[];
  spectators: Player[];
  timeRemaining: number;
  role: Role | null;
  fragments: string[];
  hints: string[];
  roomCode: string | null;
  playerId: string | null;
  isHost: boolean;
  isSpectator: boolean;
  config: RoomConfig | null;
  memoryPrompt: string | null;
  detailQuestion: string | null;
  details: Record<string, string>;
  submittedPlayers: string[];
  votedPlayers: string[];
  witnessIds: string[];
  witnessNames: string[];
  synced: boolean;
}

const initialState: GameStore = {
  phase: 'lobby',
  round: 0,
  totalRounds: 0,
  players: [],
  spectators: [],
  timeRemaining: 0,
  role: null,
  fragments: [],
  hints: [],
  roomCode: null,
  playerId: null,
  isHost: false,
  isSpectator: false,
  config: null,
  memoryPrompt: null,
  detailQuestion: null,
  details: {},
  submittedPlayers: [],
  votedPlayers: [],
  witnessIds: [],
  witnessNames: [],
  synced: false,
};

const [game, setGame] = createStore<GameStore>(initialState);

export { game, setGame };

export function resetGame() {
  setGame(initialState);
}
