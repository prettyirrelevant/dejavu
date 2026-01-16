import type { ClientMessage, RoomConfig, ServerMessage } from '@dejavu/shared';
import toast from 'solid-toast';
import { createRoom, getWebSocketUrl } from './api';
import { setSession, getSession } from './storage';
import { setGame, resetGame } from '../stores/game';
import { setConnection } from '../stores/connection';
import { WebSocketClient } from './ws';

let client: WebSocketClient | null = null;

function handleMessage(message: ServerMessage): void {
  console.log('[GameClient] Handling:', message.type);
  switch (message.type) {
    case 'room_created': {
      const { roomCode, sessionToken, playerId, isHost, config } = message.payload;
      
      setSession(roomCode, {
        token: sessionToken,
        playerId,
        expiry: Date.now() + 24 * 60 * 60 * 1000,
      });

      setGame({
        roomCode,
        playerId,
        isHost,
        isSpectator: false,
        players: [],
        spectators: [],
        config: config || null,
        phase: 'lobby',
      });
      break;
    }

    case 'room_joined': {
      const { roomCode, sessionToken, playerId, isHost, isSpectator, players, spectators, config } = message.payload;
      
      setSession(roomCode, {
        token: sessionToken,
        playerId,
        expiry: Date.now() + 24 * 60 * 60 * 1000,
      });

      setGame({
        roomCode,
        playerId,
        isHost,
        isSpectator,
        players: players || [],
        spectators: spectators || [],
        config: config || null,
        phase: 'lobby',
      });
      break;
    }

    case 'player_joined': {
      const { player, isSpectator } = message.payload;
      console.log('[GameClient] Player joined:', player.name, 'id:', player.id, 'isSpectator:', isSpectator);
      setGame((prev) => {
        const alreadyExists = isSpectator 
          ? prev.spectators.some(p => p.id === player.id)
          : prev.players.some(p => p.id === player.id);
        
        if (alreadyExists) {
          console.log('[GameClient] Player already exists, skipping');
          return prev;
        }
        
        const updated = {
          ...prev,
          ...(isSpectator
            ? { spectators: [...prev.spectators, player] }
            : { players: [...prev.players, player] }),
        };
        console.log('[GameClient] Updated players:', updated.players.map(p => p.name));
        return updated;
      });
      break;
    }

    case 'player_left': {
      const { playerId, playerName, reason } = message.payload;
      setGame((prev) => ({
        ...prev,
        players: prev.players.filter((p) => p.id !== playerId),
        spectators: prev.spectators.filter((p) => p.id !== playerId),
      }));
      const reasonText = reason === 'disconnected' ? 'disconnected' : 'left';
      toast(`${playerName} ${reasonText}`);
      break;
    }

    case 'player_ready_changed': {
      const { playerId, ready } = message.payload;
      setGame((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.id === playerId ? { ...p, isReady: ready } : p
        ),
      }));
      break;
    }

    case 'player_connection_changed': {
      const { playerId, status } = message.payload;
      setGame((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.id === playerId ? { ...p, connectionStatus: status } : p
        ),
        spectators: prev.spectators.map((p) =>
          p.id === playerId ? { ...p, connectionStatus: status } : p
        ),
      }));
      break;
    }

    case 'host_transferred': {
      const { newHostId, newHostName } = message.payload;
      setGame((prev) => ({
        ...prev,
        isHost: prev.playerId === newHostId,
        players: prev.players.map((p) => ({
          ...p,
          isHost: p.id === newHostId,
        })),
      }));
      toast(`${newHostName} is now the host`);
      break;
    }

    case 'game_started': {
      const { totalRounds } = message.payload;
      setGame((prev) => ({
        ...prev,
        totalRounds,
        round: 1,
        phase: 'memory',
      }));
      break;
    }

    case 'round_started': {
      const { roundNumber, totalRounds } = message.payload;
      setGame((prev) => ({
        ...prev,
        round: roundNumber,
        totalRounds,
      }));
      break;
    }

    case 'memory_revealed': {
      const { prompt, timeRemaining } = message.payload;
      setGame((prev) => ({
        ...prev,
        phase: 'memory',
        memoryPrompt: prompt,
        timeRemaining,
      }));
      break;
    }

    case 'role_assigned': {
      const { role, fragments, hints, timeRemaining } = message.payload;
      setGame((prev) => ({
        ...prev,
        phase: 'roles',
        role,
        fragments: fragments || [],
        hints: hints || [],
        timeRemaining,
      }));
      break;
    }

    case 'detail_question': {
      const { question, timeRemaining } = message.payload;
      setGame((prev) => ({
        ...prev,
        phase: 'details',
        detailQuestion: question,
        timeRemaining,
        submittedPlayers: [],
      }));
      break;
    }

    case 'player_submitted_detail': {
      const { playerId } = message.payload;
      setGame((prev) => ({
        ...prev,
        submittedPlayers: [...prev.submittedPlayers, playerId],
      }));
      break;
    }

    case 'details_revealed': {
      const { details, timeRemaining } = message.payload;
      setGame((prev) => ({
        ...prev,
        phase: 'questions',
        details,
        timeRemaining,
      }));
      break;
    }

    case 'voting_started': {
      const { timeRemaining } = message.payload;
      setGame((prev) => ({
        ...prev,
        phase: 'voting',
        timeRemaining,
        votedPlayers: [],
      }));
      break;
    }

    case 'player_voted': {
      const { playerId } = message.payload;
      setGame((prev) => ({
        ...prev,
        votedPlayers: [...prev.votedPlayers, playerId],
      }));
      break;
    }

    case 'round_results': {
      const { totalScores, timeRemaining } = message.payload;
      setGame((prev) => ({
        ...prev,
        phase: 'results',
        timeRemaining,
        players: prev.players.map((p) => ({
          ...p,
          score: totalScores[p.id] ?? p.score,
        })),
      }));
      break;
    }

    case 'game_finished': {
      const { reason, winner } = message.payload;
      setGame((prev) => ({
        ...prev,
        phase: 'lobby',
        players: prev.players.map((p) => ({ ...p, isReady: false })),
      }));
      if (reason === 'completed' && winner?.name) {
        toast.success(`Game over! ${winner.name} wins!`);
      } else if (reason === 'insufficient_players') {
        toast.error('Game ended: not enough players');
      } else if (reason === 'host_ended') {
        toast('Game ended by host');
      }
      break;
    }

    case 'phase_time_update': {
      const { timeRemaining } = message.payload;
      setGame((prev) => ({ ...prev, timeRemaining }));
      break;
    }

    case 'reconnect_success': {
      const { currentPhase, roundNumber, yourRole, yourFragments, yourHints, players } = message.payload;
      setGame((prev) => {
        const currentPlayer = players?.find((p) => p.id === prev.playerId);
        return {
          ...prev,
          phase: currentPhase,
          round: roundNumber,
          role: yourRole || null,
          fragments: yourFragments || [],
          hints: yourHints || [],
          players: players || prev.players,
          isHost: currentPlayer?.isHost ?? prev.isHost,
        };
      });
      break;
    }

    case 'pong':
      client?.handlePong();
      break;

    case 'error': {
      console.error('Server error:', message.payload.code, message.payload.message);
      toast.error(message.payload.message);
      break;
    }
  }
}

function handleStatusChange(status: 'connecting' | 'connected' | 'disconnected' | 'error'): void {
  setConnection({ status });
}

function handleLatencyUpdate(latency: number, timestamp: number): void {
  setConnection({ latency, lastPong: timestamp });
}

export async function createAndJoinRoom(playerName: string, config: RoomConfig): Promise<string> {
  const { roomCode } = await createRoom();
  
  await connectToRoom(roomCode);
  
  send({
    type: 'create_room',
    payload: { playerName, config },
  });

  return roomCode;
}

export async function joinRoom(roomCode: string, playerName: string, asSpectator = false): Promise<void> {
  await connectToRoom(roomCode);
  
  send({
    type: 'join_room',
    payload: { roomCode, playerName, asSpectator },
  });
}

export async function reconnectToRoom(roomCode: string): Promise<boolean> {
  const session = getSession(roomCode);
  if (!session) return false;

  setGame((prev) => ({
    ...prev,
    roomCode,
    playerId: session.playerId,
  }));

  await connectToRoom(roomCode);
  
  send({
    type: 'reconnect',
    payload: { roomCode, sessionToken: session.token },
  });

  return true;
}

async function connectToRoom(roomCode: string): Promise<void> {
  if (client) {
    client.disconnect();
  }

  const url = getWebSocketUrl(roomCode);
  
  client = new WebSocketClient({
    url,
    onMessage: handleMessage,
    onStatusChange: handleStatusChange,
    onLatencyUpdate: handleLatencyUpdate,
  });

  client.connect();

  return new Promise((resolve) => {
    const checkConnection = setInterval(() => {
      if (client?.isConnected()) {
        clearInterval(checkConnection);
        resolve();
      }
    }, 50);

    setTimeout(() => {
      clearInterval(checkConnection);
      resolve();
    }, 5000);
  });
}

export function send(message: ClientMessage): void {
  client?.send(message);
}

export function setReady(ready: boolean): void {
  send({ type: 'set_ready', payload: { ready } });
}

export function startGame(): void {
  send({ type: 'start_game', payload: {} });
}

export function leaveRoom(): void {
  send({ type: 'leave_room', payload: {} });
  client?.disconnect();
  client = null;
  resetGame();
}

export function submitDetail(answer: string): void {
  send({ type: 'submit_detail', payload: { answer } });
}

export function castVote(targetPlayerId: string): void {
  send({ type: 'cast_vote', payload: { targetPlayerId } });
}

export function continueGame(): void {
  send({ type: 'continue_game', payload: {} });
}
