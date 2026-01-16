import { DurableObject } from 'cloudflare:workers';
import {
  ClientMessageSchema,
  DEFAULT_CONFIG,
  MIN_PLAYERS,
  PHASE_DURATIONS,
  PLAYER_NAME_REGEX,
  type ClientMessage,
  type ConnectionStatus,
  type GameState,
  type Phase,
  type Player,
  type RoomConfig,
  type ServerMessage,
} from '@dejavu/shared';

interface Session {
  playerId: string;
  socket: WebSocket;
  lastHeartbeat: number;
  isSpectator: boolean;
}

interface PlayerData {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  connectionStatus: ConnectionStatus;
  score: number;
  sessionToken: string;
}

interface RoomState {
  roomCode: string;
  gameState: GameState;
  config: RoomConfig;
  players: Map<string, PlayerData>;
  spectators: Map<string, PlayerData>;
  currentPhase: Phase;
  currentRound: number;
  phaseEndTime: number;
}

export class GameRoom extends DurableObject<Env> {
  private sessions = new Map<string, Session>();
  private state: RoomState | null = null;

  async initialize(roomCode: string): Promise<void> {
    const existing = await this.ctx.storage.get<RoomState>('state');
    if (existing) {
      this.state = {
        ...existing,
        players: new Map(Object.entries(existing.players || {})),
        spectators: new Map(Object.entries(existing.spectators || {})),
      };
      return;
    }

    this.state = {
      roomCode,
      gameState: 'lobby',
      config: { ...DEFAULT_CONFIG } as RoomConfig,
      players: new Map(),
      spectators: new Map(),
      currentPhase: 'lobby',
      currentRound: 0,
      phaseEndTime: 0,
    };

    await this.persistState();
  }

  private async persistState(): Promise<void> {
    if (!this.state) return;

    const serializable = {
      ...this.state,
      players: Object.fromEntries(this.state.players),
      spectators: Object.fromEntries(this.state.spectators),
    };

    await this.ctx.storage.put('state', serializable);
  }

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    this.ctx.acceptWebSocket(server);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return;

    try {
      const parsed = JSON.parse(message);
      const result = ClientMessageSchema.safeParse(parsed);

      if (!result.success) {
        this.sendError(ws, 'INVALID_MESSAGE', 'Invalid message format');
        return;
      }

      await this.handleMessage(ws, result.data);
    } catch {
      this.sendError(ws, 'INVALID_MESSAGE', 'Failed to parse message');
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const session = this.findSessionBySocket(ws);
    if (!session) return;

    this.sessions.delete(session.playerId);
    await this.handlePlayerDisconnect(session.playerId);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws);
  }

  private findSessionBySocket(ws: WebSocket): Session | undefined {
    for (const session of this.sessions.values()) {
      if (session.socket === ws) return session;
    }
    return undefined;
  }

  private async handleMessage(ws: WebSocket, message: ClientMessage): Promise<void> {
    switch (message.type) {
      case 'join_room':
        await this.handleJoinRoom(ws, message.payload);
        break;
      case 'create_room':
        await this.handleCreateRoom(ws, message.payload);
        break;
      case 'set_ready':
        await this.handleSetReady(ws, message.payload);
        break;
      case 'start_game':
        await this.handleStartGame(ws);
        break;
      case 'leave_room':
        await this.handleLeaveRoom(ws);
        break;
      case 'ping':
        await this.handlePing(ws, message.payload);
        break;
      case 'submit_detail':
        await this.handleSubmitDetail(ws, message.payload);
        break;
      case 'ask_question':
        await this.handleAskQuestion(ws, message.payload);
        break;
      case 'answer_question':
        await this.handleAnswerQuestion(ws, message.payload);
        break;
      case 'call_vote':
        await this.handleCallVote(ws);
        break;
      case 'cast_vote':
        await this.handleCastVote(ws, message.payload);
        break;
      case 'continue_game':
        await this.handleContinueGame(ws);
        break;
      case 'reconnect':
        await this.handleReconnect(ws, message.payload);
        break;
      default:
        break;
    }
  }

  private async handleJoinRoom(
    ws: WebSocket,
    payload: { roomCode: string; playerName: string; asSpectator?: boolean }
  ): Promise<void> {
    if (!this.state) {
      this.sendError(ws, 'ROOM_NOT_FOUND', 'Room does not exist');
      return;
    }

    if (!PLAYER_NAME_REGEX.test(payload.playerName)) {
      this.sendError(ws, 'INVALID_MESSAGE', 'Invalid player name');
      return;
    }

    const isNameTaken = [...this.state.players.values(), ...this.state.spectators.values()].some(
      (p) => p.name.toLowerCase() === payload.playerName.toLowerCase()
    );

    if (isNameTaken) {
      this.sendError(ws, 'NAME_TAKEN', 'Name already taken');
      return;
    }

    if (!payload.asSpectator && this.state.players.size >= this.state.config.maxPlayers) {
      this.sendError(ws, 'ROOM_FULL', 'Room is full');
      return;
    }

    if (this.state.gameState === 'playing' && !payload.asSpectator) {
      this.sendError(ws, 'GAME_IN_PROGRESS', 'Game already in progress');
      return;
    }

    const playerId = this.generateId();
    const sessionToken = this.generateSessionToken(playerId);

    const playerData: PlayerData = {
      id: playerId,
      name: payload.playerName,
      isHost: this.state.players.size === 0,
      isReady: false,
      connectionStatus: 'connected',
      score: 0,
      sessionToken,
    };

    if (payload.asSpectator) {
      this.state.spectators.set(playerId, playerData);
    } else {
      this.state.players.set(playerId, playerData);
    }

    this.sessions.set(playerId, {
      playerId,
      socket: ws,
      lastHeartbeat: Date.now(),
      isSpectator: payload.asSpectator ?? false,
    });

    await this.persistState();

    const response: ServerMessage = {
      type: 'room_joined',
      payload: {
        roomCode: this.state.roomCode,
        sessionToken,
        playerId,
        isHost: playerData.isHost,
        isSpectator: payload.asSpectator ?? false,
        players: this.getPlayersArray(),
        spectators: this.getSpectatorsArray(),
        config: this.state.config,
      },
    };

    this.send(ws, response);

    const joinedMessage: ServerMessage = {
      type: 'player_joined',
      payload: {
        player: this.playerDataToPlayer(playerData),
        isSpectator: payload.asSpectator ?? false,
      },
    };

    this.broadcastExcept(playerId, joinedMessage);
  }

  private async handleCreateRoom(
    ws: WebSocket,
    payload: { playerName: string; config: RoomConfig }
  ): Promise<void> {
    if (!this.state) {
      this.sendError(ws, 'ROOM_NOT_FOUND', 'Room not initialized');
      return;
    }

    this.state.config = payload.config;
    await this.handleJoinRoom(ws, {
      roomCode: this.state.roomCode,
      playerName: payload.playerName,
    });
  }

  private async handleSetReady(ws: WebSocket, payload: { ready: boolean }): Promise<void> {
    const session = this.findSessionBySocket(ws);
    if (!session || !this.state) return;

    const player = this.state.players.get(session.playerId);
    if (!player) return;

    player.isReady = payload.ready;
    await this.persistState();

    const message: ServerMessage = {
      type: 'player_ready_changed',
      payload: {
        playerId: session.playerId,
        ready: payload.ready,
      },
    };

    this.broadcast(message);
  }

  private async handleStartGame(ws: WebSocket): Promise<void> {
    const session = this.findSessionBySocket(ws);
    if (!session || !this.state) return;

    const player = this.state.players.get(session.playerId);
    if (!player?.isHost) {
      this.sendError(ws, 'NOT_HOST', 'Only host can start game');
      return;
    }

    const readyPlayers = [...this.state.players.values()].filter((p) => p.isReady);
    if (readyPlayers.length < MIN_PLAYERS) {
      this.sendError(ws, 'INVALID_ACTION', `Need at least ${MIN_PLAYERS} ready players`);
      return;
    }

    this.state.gameState = 'playing';
    this.state.currentRound = 1;
    await this.persistState();

    const message: ServerMessage = {
      type: 'game_started',
      payload: {
        totalRounds: this.state.config.rounds,
        players: [...this.state.players.values()].map((p) => ({ id: p.id, name: p.name })),
      },
    };

    this.broadcast(message);
    await this.startRound();
  }

  private async handleLeaveRoom(ws: WebSocket): Promise<void> {
    const session = this.findSessionBySocket(ws);
    if (!session) return;

    await this.removePlayer(session.playerId, 'left');
    ws.close(1000, 'Left room');
  }

  private async handlePing(ws: WebSocket, _payload: { clientTime: number }): Promise<void> {
    const session = this.findSessionBySocket(ws);
    if (session) {
      session.lastHeartbeat = Date.now();
    }

    const response: ServerMessage = {
      type: 'pong',
      payload: { serverTime: Date.now() },
    };

    this.send(ws, response);
  }

  private async handleSubmitDetail(ws: WebSocket, _payload: { answer: string }): Promise<void> {
    if (!this.state || this.state.currentPhase !== 'details') return;
    const session = this.findSessionBySocket(ws);
    if (!session || session.isSpectator) return;
  }

  private async handleAskQuestion(
    ws: WebSocket,
    _payload: { targetPlayerId: string; question: string }
  ): Promise<void> {
    if (!this.state || this.state.currentPhase !== 'questions') return;
    const session = this.findSessionBySocket(ws);
    if (!session || session.isSpectator) return;
  }

  private async handleAnswerQuestion(
    ws: WebSocket,
    _payload: { questionId: string; answer: string }
  ): Promise<void> {
    if (!this.state || this.state.currentPhase !== 'questions') return;
    const session = this.findSessionBySocket(ws);
    if (!session || session.isSpectator) return;
  }

  private async handleCallVote(ws: WebSocket): Promise<void> {
    if (!this.state || this.state.currentPhase !== 'questions') return;
    const session = this.findSessionBySocket(ws);
    if (!session || session.isSpectator) return;
  }

  private async handleCastVote(ws: WebSocket, _payload: { targetPlayerId: string }): Promise<void> {
    if (!this.state || this.state.currentPhase !== 'voting') return;
    const session = this.findSessionBySocket(ws);
    if (!session || session.isSpectator) return;
  }

  private async handleContinueGame(ws: WebSocket): Promise<void> {
    const session = this.findSessionBySocket(ws);
    if (!session || !this.state) return;

    const player = this.state.players.get(session.playerId);
    if (!player?.isHost) return;
  }

  private async handleReconnect(
    ws: WebSocket,
    payload: { roomCode: string; sessionToken: string }
  ): Promise<void> {
    if (!this.state) {
      this.sendError(ws, 'ROOM_NOT_FOUND', 'Room does not exist');
      return;
    }

    const player = [...this.state.players.values(), ...this.state.spectators.values()].find(
      (p) => p.sessionToken === payload.sessionToken
    );

    if (!player) {
      this.sendError(ws, 'INVALID_SESSION', 'Invalid session token');
      return;
    }

    player.connectionStatus = 'connected';
    this.sessions.set(player.id, {
      playerId: player.id,
      socket: ws,
      lastHeartbeat: Date.now(),
      isSpectator: this.state.spectators.has(player.id),
    });

    await this.persistState();

    const response: ServerMessage = {
      type: 'reconnect_success',
      payload: {
        gameState: this.state.gameState,
        currentPhase: this.state.currentPhase,
        roundNumber: this.state.currentRound,
        players: this.getPlayersArray(),
        scores: Object.fromEntries([...this.state.players.values()].map((p) => [p.id, p.score])),
        phaseData: {},
        status: 'active',
      },
    };

    this.send(ws, response);
  }

  private async handlePlayerDisconnect(playerId: string): Promise<void> {
    if (!this.state) return;

    const player = this.state.players.get(playerId) || this.state.spectators.get(playerId);
    if (!player) return;

    if (this.state.gameState === 'lobby') {
      await this.removePlayer(playerId, 'disconnected');
      return;
    }

    player.connectionStatus = 'dropped';
    await this.persistState();

    const message: ServerMessage = {
      type: 'player_connection_changed',
      payload: {
        playerId,
        status: 'dropped',
      },
    };

    this.broadcast(message);

    if (player.isHost && this.state.players.size > 1) {
      await this.transferHost(playerId);
    }
  }

  private async removePlayer(
    playerId: string,
    reason: 'left' | 'kicked' | 'disconnected'
  ): Promise<void> {
    if (!this.state) return;

    const player = this.state.players.get(playerId) || this.state.spectators.get(playerId);
    if (!player) return;

    this.state.players.delete(playerId);
    this.state.spectators.delete(playerId);
    this.sessions.delete(playerId);

    await this.persistState();

    const message: ServerMessage = {
      type: 'player_left',
      payload: {
        playerId,
        playerName: player.name,
        reason,
      },
    };

    this.broadcast(message);

    if (player.isHost && this.state.players.size > 0) {
      await this.transferHost(playerId);
    }
  }

  private async transferHost(previousHostId: string): Promise<void> {
    if (!this.state || this.state.players.size === 0) return;

    const newHost = [...this.state.players.values()][0];
    if (!newHost) return;

    newHost.isHost = true;
    await this.persistState();

    const message: ServerMessage = {
      type: 'host_transferred',
      payload: {
        newHostId: newHost.id,
        newHostName: newHost.name,
        previousHostId,
      },
    };

    this.broadcast(message);
  }

  private async startRound(): Promise<void> {
    if (!this.state) return;

    this.state.currentPhase = 'memory';
    this.state.phaseEndTime = Date.now() + this.getScaledDuration('memory');
    await this.persistState();

    const message: ServerMessage = {
      type: 'round_started',
      payload: {
        roundNumber: this.state.currentRound,
        totalRounds: this.state.config.rounds,
      },
    };

    this.broadcast(message);

    const memoryMessage: ServerMessage = {
      type: 'memory_revealed',
      payload: {
        prompt: 'The last day of summer. A goodbye at a train station. Something was left behind on the platform.',
        timeRemaining: this.getScaledDuration('memory'),
      },
    };

    this.broadcast(memoryMessage);

    this.ctx.storage.setAlarm(this.state.phaseEndTime);
  }

  async alarm(): Promise<void> {
    if (!this.state) return;

    switch (this.state.currentPhase) {
      case 'memory':
        await this.transitionToRoles();
        break;
      case 'roles':
        await this.transitionToDetails();
        break;
      case 'details':
        await this.transitionToQuestions();
        break;
      case 'questions':
        await this.transitionToVoting();
        break;
      case 'voting':
        await this.transitionToResults();
        break;
      case 'results':
        await this.handleRoundEnd();
        break;
    }
  }

  private async transitionToRoles(): Promise<void> {
    if (!this.state) return;

    this.state.currentPhase = 'roles';
    this.state.phaseEndTime = Date.now() + this.getScaledDuration('roles');
    await this.persistState();

    this.ctx.storage.setAlarm(this.state.phaseEndTime);
  }

  private async transitionToDetails(): Promise<void> {
    if (!this.state) return;

    this.state.currentPhase = 'details';
    this.state.phaseEndTime = Date.now() + this.getScaledDuration('details');
    await this.persistState();

    const message: ServerMessage = {
      type: 'detail_question',
      payload: {
        question: 'What was the weather like?',
        timeRemaining: this.getScaledDuration('details'),
      },
    };

    this.broadcast(message);
    this.ctx.storage.setAlarm(this.state.phaseEndTime);
  }

  private async transitionToQuestions(): Promise<void> {
    if (!this.state) return;

    this.state.currentPhase = 'questions';
    this.state.phaseEndTime = Date.now() + this.getScaledDuration('questions');
    await this.persistState();

    this.ctx.storage.setAlarm(this.state.phaseEndTime);
  }

  private async transitionToVoting(): Promise<void> {
    if (!this.state) return;

    this.state.currentPhase = 'voting';
    this.state.phaseEndTime = Date.now() + this.getScaledDuration('voting');
    await this.persistState();

    const message: ServerMessage = {
      type: 'voting_started',
      payload: {
        timeRemaining: this.getScaledDuration('voting'),
      },
    };

    this.broadcast(message);
    this.ctx.storage.setAlarm(this.state.phaseEndTime);
  }

  private async transitionToResults(): Promise<void> {
    if (!this.state) return;

    this.state.currentPhase = 'results';
    this.state.phaseEndTime = Date.now() + this.getScaledDuration('results');
    await this.persistState();

    this.ctx.storage.setAlarm(this.state.phaseEndTime);
  }

  private async handleRoundEnd(): Promise<void> {
    if (!this.state) return;

    if (this.state.currentRound >= this.state.config.rounds) {
      await this.endGame('completed');
    } else {
      this.state.currentRound++;
      await this.startRound();
    }
  }

  private async endGame(reason: 'completed' | 'insufficient_players' | 'host_ended'): Promise<void> {
    if (!this.state) return;

    this.state.gameState = 'finished';
    this.state.currentPhase = 'lobby';
    await this.persistState();

    const players = [...this.state.players.values()];
    const winner = players.sort((a, b) => b.score - a.score)[0];

    const message: ServerMessage = {
      type: 'game_finished',
      payload: {
        reason,
        finalScores: Object.fromEntries(players.map((p) => [p.id, p.score])),
        winner: winner ? { id: winner.id, name: winner.name, score: winner.score } : { id: '', name: '', score: 0 },
        stats: {},
        roundsCompleted: this.state.currentRound,
        roundsTotal: this.state.config.rounds,
      },
    };

    this.broadcast(message);
  }

  private getScaledDuration(phase: keyof typeof PHASE_DURATIONS): number {
    if (!this.state) return PHASE_DURATIONS[phase];
    return Math.round(PHASE_DURATIONS[phase] * this.state.config.timeScale);
  }

  private getPlayersArray(): Player[] {
    if (!this.state) return [];
    return [...this.state.players.values()].map(this.playerDataToPlayer);
  }

  private getSpectatorsArray(): Player[] {
    if (!this.state) return [];
    return [...this.state.spectators.values()].map(this.playerDataToPlayer);
  }

  private playerDataToPlayer(data: PlayerData): Player {
    return {
      id: data.id,
      name: data.name,
      isHost: data.isHost,
      isReady: data.isReady,
      connectionStatus: data.connectionStatus,
      voiceStatus: 'disconnected',
      score: data.score,
    };
  }

  private generateId(): string {
    return `p${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
  }

  private generateSessionToken(playerId: string): string {
    if (!this.state) return '';
    const timestamp = Date.now();
    const random = crypto.randomUUID().slice(0, 8);
    return `${this.state.roomCode}.${playerId}.${timestamp}.${random}`;
  }

  private send(ws: WebSocket, message: ServerMessage): void {
    try {
      ws.send(JSON.stringify(message));
    } catch {}
  }

  private sendError(ws: WebSocket, code: string, message: string): void {
    this.send(ws, {
      type: 'error',
      payload: { code: code as any, message },
    });
  }

  private broadcast(message: ServerMessage): void {
    for (const session of this.sessions.values()) {
      this.send(session.socket, message);
    }
  }

  private broadcastExcept(excludePlayerId: string, message: ServerMessage): void {
    for (const session of this.sessions.values()) {
      if (session.playerId !== excludePlayerId) {
        this.send(session.socket, message);
      }
    }
  }
}

interface Env {
  GAME_ROOM: DurableObjectNamespace<GameRoom>;
  AI: Ai;
  CALLS_APP_ID: string;
  CALLS_APP_SECRET: string;
}
