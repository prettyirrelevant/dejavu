import { env, runInDurableObject, runDurableObjectAlarm } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { GameRoom } from '../room';
import { getFallbackScenario } from '../ai';

function createMockWebSocket(): WebSocket & { sentMessages: string[]; closeCalled: boolean } {
  const sentMessages: string[] = [];
  let closeCalled = false;

  return {
    sentMessages,
    closeCalled,
    send(data: string) {
      sentMessages.push(data);
    },
    close() {
      closeCalled = true;
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    readyState: WebSocket.OPEN,
    binaryType: 'blob',
    bufferedAmount: 0,
    extensions: '',
    protocol: '',
    url: '',
    onopen: null,
    onclose: null,
    onerror: null,
    onmessage: null,
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
  } as any;
}

function getLastMessage(ws: { sentMessages: string[] }): any {
  const lastMsg = ws.sentMessages[ws.sentMessages.length - 1];
  return lastMsg ? JSON.parse(lastMsg) : null;
}

function getMessagesByType(ws: { sentMessages: string[] }, type: string): any[] {
  return ws.sentMessages.map((m) => JSON.parse(m)).filter((m) => m.type === type);
}

describe('GameRoom Durable Object', () => {
  describe('Room Initialization', () => {
    it('initializes room with correct default state', async () => {
      const id = env.GAME_ROOM.idFromName('init-test');
      const stub = env.GAME_ROOM.get(id);

      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        await instance.initialize('INIT01');

        const roomState = await state.storage.get<any>('state');
        expect(roomState).toBeDefined();
        expect(roomState.roomCode).toBe('INIT01');
        expect(roomState.gameState).toBe('lobby');
        expect(roomState.currentPhase).toBe('lobby');
        expect(roomState.currentRound).toBe(0);
        expect(roomState.config).toBeDefined();
        expect(roomState.config.rounds).toBe(5);
        expect(roomState.config.maxPlayers).toBe(6);
      });
    });
  });

  describe('WebSocket Connection', () => {
    it('rejects non-WebSocket requests', async () => {
      const id = env.GAME_ROOM.idFromName('ws-test');
      const stub = env.GAME_ROOM.get(id);

      const response = await stub.fetch('http://localhost/');
      expect(response.status).toBe(426);
      expect(await response.text()).toBe('Expected WebSocket');
    });

    it('accepts WebSocket upgrade requests', async () => {
      const id = env.GAME_ROOM.idFromName('ws-upgrade-test');
      const stub = env.GAME_ROOM.get(id);

      const response = await stub.fetch('http://localhost/ws', {
        headers: { Upgrade: 'websocket' },
      });

      expect(response.status).toBe(101);
      expect(response.webSocket).toBeDefined();
    });
  });

  describe('Player Join', () => {
    it('allows first player to join and become host', async () => {
      const id = env.GAME_ROOM.idFromName('join-host');
      const stub = env.GAME_ROOM.get(id);

      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        await instance.initialize('JOIN01');

        const ws = createMockWebSocket();
        await instance.webSocketMessage(
          ws,
          JSON.stringify({
            type: 'join_room',
            payload: { roomCode: 'JOIN01', playerName: 'Alice' },
          })
        );

        const response = getLastMessage(ws);
        expect(response.type).toBe('room_joined');
        expect(response.payload.isHost).toBe(true);
        expect(response.payload.playerId).toBeDefined();
        expect(response.payload.sessionToken).toBeDefined();

        const roomState = await state.storage.get<any>('state');
        expect(Object.keys(roomState.players)).toHaveLength(1);
      });
    });

    it('allows second player to join as non-host', async () => {
      const id = env.GAME_ROOM.idFromName('join-nonhost');
      const stub = env.GAME_ROOM.get(id);

      await runInDurableObject(stub, async (instance: GameRoom) => {
        await instance.initialize('JOIN02');

        const ws1 = createMockWebSocket();
        await instance.webSocketMessage(
          ws1,
          JSON.stringify({
            type: 'join_room',
            payload: { roomCode: 'JOIN02', playerName: 'Alice' },
          })
        );

        const ws2 = createMockWebSocket();
        await instance.webSocketMessage(
          ws2,
          JSON.stringify({
            type: 'join_room',
            payload: { roomCode: 'JOIN02', playerName: 'Bob' },
          })
        );

        const response = getLastMessage(ws2);
        expect(response.type).toBe('room_joined');
        expect(response.payload.isHost).toBe(false);
      });
    });

    it('rejects invalid player names', async () => {
      const id = env.GAME_ROOM.idFromName('join-invalid');
      const stub = env.GAME_ROOM.get(id);

      await runInDurableObject(stub, async (instance: GameRoom) => {
        await instance.initialize('INVLD1');

        const ws = createMockWebSocket();
        await instance.webSocketMessage(
          ws,
          JSON.stringify({
            type: 'join_room',
            payload: { roomCode: 'INVLD1', playerName: 'has spaces!' },
          })
        );

        const response = getLastMessage(ws);
        expect(response.type).toBe('error');
        expect(response.payload.code).toBe('INVALID_MESSAGE');
      });
    });

    it('rejects duplicate player names (case insensitive)', async () => {
      const id = env.GAME_ROOM.idFromName('join-dup');
      const stub = env.GAME_ROOM.get(id);

      await runInDurableObject(stub, async (instance: GameRoom) => {
        await instance.initialize('DUPN01');

        const ws1 = createMockWebSocket();
        await instance.webSocketMessage(
          ws1,
          JSON.stringify({
            type: 'join_room',
            payload: { roomCode: 'DUPN01', playerName: 'Alice' },
          })
        );

        const ws2 = createMockWebSocket();
        await instance.webSocketMessage(
          ws2,
          JSON.stringify({
            type: 'join_room',
            payload: { roomCode: 'DUPN01', playerName: 'ALICE' },
          })
        );

        const response = getLastMessage(ws2);
        expect(response.type).toBe('error');
        expect(response.payload.code).toBe('NAME_TAKEN');
      });
    });

    it('allows spectator to join', async () => {
      const id = env.GAME_ROOM.idFromName('join-spectator');
      const stub = env.GAME_ROOM.get(id);

      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        await instance.initialize('SPEC01');

        const ws1 = createMockWebSocket();
        await instance.webSocketMessage(
          ws1,
          JSON.stringify({
            type: 'join_room',
            payload: { roomCode: 'SPEC01', playerName: 'Player1' },
          })
        );

        const wsSpec = createMockWebSocket();
        await instance.webSocketMessage(
          wsSpec,
          JSON.stringify({
            type: 'join_room',
            payload: { roomCode: 'SPEC01', playerName: 'Spectator', asSpectator: true },
          })
        );

        const response = getLastMessage(wsSpec);
        expect(response.type).toBe('room_joined');
        expect(response.payload.isSpectator).toBe(true);

        const roomState = await state.storage.get<any>('state');
        expect(Object.keys(roomState.spectators)).toHaveLength(1);
      });
    });
  });

  describe('Room Creation', () => {
    it('creates room with custom config', async () => {
      const id = env.GAME_ROOM.idFromName('create-config');
      const stub = env.GAME_ROOM.get(id);

      await runInDurableObject(stub, async (instance: GameRoom) => {
        await instance.initialize('CREA01');

        const ws = createMockWebSocket();
        await instance.webSocketMessage(
          ws,
          JSON.stringify({
            type: 'create_room',
            payload: {
              playerName: 'Host',
              config: {
                rounds: 7,
                timeScale: 1.5,
                maxPlayers: 8,
                witnessCount: 2,
                allowSpectators: false,
                voiceEnabled: true,
              },
            },
          })
        );

        const response = getLastMessage(ws);
        expect(response.type).toBe('room_joined');
        expect(response.payload.config.rounds).toBe(7);
        expect(response.payload.config.maxPlayers).toBe(8);
        expect(response.payload.config.timeScale).toBe(1.5);
      });
    });
  });

  describe('Ready State', () => {
    it('sets player ready state', async () => {
      const id = env.GAME_ROOM.idFromName('ready-test');
      const stub = env.GAME_ROOM.get(id);

      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        await instance.initialize('REDY01');

        const ws = createMockWebSocket();
        await instance.webSocketMessage(
          ws,
          JSON.stringify({
            type: 'join_room',
            payload: { roomCode: 'REDY01', playerName: 'Alice' },
          })
        );

        await instance.webSocketMessage(
          ws,
          JSON.stringify({
            type: 'set_ready',
            payload: { ready: true },
          })
        );

        const readyMessages = getMessagesByType(ws, 'player_ready_changed');
        expect(readyMessages).toHaveLength(1);
        expect(readyMessages[0].payload.ready).toBe(true);

        const roomState = await state.storage.get<any>('state');
        const players = Object.values(roomState.players) as any[];
        expect(players[0].isReady).toBe(true);
      });
    });

    it('toggles ready state', async () => {
      const id = env.GAME_ROOM.idFromName('ready-toggle');
      const stub = env.GAME_ROOM.get(id);

      await runInDurableObject(stub, async (instance: GameRoom) => {
        await instance.initialize('TOGL01');

        const ws = createMockWebSocket();
        await instance.webSocketMessage(
          ws,
          JSON.stringify({
            type: 'join_room',
            payload: { roomCode: 'TOGL01', playerName: 'Alice' },
          })
        );

        await instance.webSocketMessage(
          ws,
          JSON.stringify({
            type: 'set_ready',
            payload: { ready: true },
          })
        );

        await instance.webSocketMessage(
          ws,
          JSON.stringify({
            type: 'set_ready',
            payload: { ready: false },
          })
        );

        const readyMessages = getMessagesByType(ws, 'player_ready_changed');
        expect(readyMessages).toHaveLength(2);
        expect(readyMessages[1].payload.ready).toBe(false);
      });
    });
  });

  describe('Game Start', () => {
    it('only host can start the game', async () => {
      const id = env.GAME_ROOM.idFromName('start-host');
      const stub = env.GAME_ROOM.get(id);

      await runInDurableObject(stub, async (instance: GameRoom) => {
        await instance.initialize('HOST01');

        const wsHost = createMockWebSocket();
        await instance.webSocketMessage(
          wsHost,
          JSON.stringify({
            type: 'join_room',
            payload: { roomCode: 'HOST01', playerName: 'Host' },
          })
        );

        const wsPlayer = createMockWebSocket();
        await instance.webSocketMessage(
          wsPlayer,
          JSON.stringify({
            type: 'join_room',
            payload: { roomCode: 'HOST01', playerName: 'Player' },
          })
        );

        await instance.webSocketMessage(
          wsPlayer,
          JSON.stringify({
            type: 'start_game',
            payload: {},
          })
        );

        const errorMessages = getMessagesByType(wsPlayer, 'error');
        expect(errorMessages.some((m) => m.payload.code === 'NOT_HOST')).toBe(true);
      });
    });

    it('requires minimum players to start', async () => {
      const id = env.GAME_ROOM.idFromName('start-min');
      const stub = env.GAME_ROOM.get(id);

      await runInDurableObject(stub, async (instance: GameRoom) => {
        await instance.initialize('MINP01');

        const ws1 = createMockWebSocket();
        await instance.webSocketMessage(
          ws1,
          JSON.stringify({
            type: 'join_room',
            payload: { roomCode: 'MINP01', playerName: 'Alice' },
          })
        );

        const ws2 = createMockWebSocket();
        await instance.webSocketMessage(
          ws2,
          JSON.stringify({
            type: 'join_room',
            payload: { roomCode: 'MINP01', playerName: 'Bob' },
          })
        );

        await instance.webSocketMessage(
          ws1,
          JSON.stringify({
            type: 'set_ready',
            payload: { ready: true },
          })
        );
        await instance.webSocketMessage(
          ws2,
          JSON.stringify({
            type: 'set_ready',
            payload: { ready: true },
          })
        );

        await instance.webSocketMessage(
          ws1,
          JSON.stringify({
            type: 'start_game',
            payload: {},
          })
        );

        const errorMessages = getMessagesByType(ws1, 'error');
        expect(errorMessages.some((m) => m.payload.code === 'INVALID_ACTION')).toBe(true);
      });
    });
  });

  describe('Game Flow', () => {
    it('starts game and enters memory phase', async () => {
      const id = env.GAME_ROOM.idFromName('game-flow');
      const stub = env.GAME_ROOM.get(id);

      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        await instance.initialize('FLOW01');

        const players: any[] = [];
        for (let i = 0; i < 3; i++) {
          const ws = createMockWebSocket();
          await instance.webSocketMessage(
            ws,
            JSON.stringify({
              type: 'join_room',
              payload: { roomCode: 'FLOW01', playerName: `Player${i}` },
            })
          );
          await instance.webSocketMessage(
            ws,
            JSON.stringify({
              type: 'set_ready',
              payload: { ready: true },
            })
          );
          players.push(ws);
        }

        await instance.webSocketMessage(
          players[0],
          JSON.stringify({
            type: 'start_game',
            payload: {},
          })
        );

        const gameStartedMessages = getMessagesByType(players[0], 'game_started');
        expect(gameStartedMessages).toHaveLength(1);
        expect(gameStartedMessages[0].payload.totalRounds).toBe(5);

        const memoryMessages = getMessagesByType(players[0], 'memory_revealed');
        expect(memoryMessages).toHaveLength(1);
        expect(memoryMessages[0].payload.prompt).toBeDefined();

        const roomState = await state.storage.get<any>('state');
        expect(roomState.gameState).toBe('playing');
        expect(roomState.currentPhase).toBe('memory');
        expect(roomState.currentRound).toBe(1);
      });
    });

    it('transitions phases via alarms', async () => {
      const id = env.GAME_ROOM.idFromName('phase-alarm');
      const stub = env.GAME_ROOM.get(id);

      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        await instance.initialize('ALRM01');

        const players: any[] = [];
        for (let i = 0; i < 3; i++) {
          const ws = createMockWebSocket();
          await instance.webSocketMessage(
            ws,
            JSON.stringify({
              type: 'join_room',
              payload: { roomCode: 'ALRM01', playerName: `Player${i}` },
            })
          );
          await instance.webSocketMessage(
            ws,
            JSON.stringify({
              type: 'set_ready',
              payload: { ready: true },
            })
          );
          players.push(ws);
        }

        await instance.webSocketMessage(
          players[0],
          JSON.stringify({
            type: 'start_game',
            payload: {},
          })
        );

        let roomState = await state.storage.get<any>('state');
        expect(roomState.currentPhase).toBe('memory');
      });

      const alarmRan = await runDurableObjectAlarm(stub);
      expect(alarmRan).toBe(true);

      await runInDurableObject(stub, async (_instance: GameRoom, state) => {
        const roomState = await state.storage.get<any>('state');
        expect(roomState.currentPhase).toBe('roles');
      });
    });
  });

  describe('Host Transfer', () => {
    it('transfers host when host leaves', async () => {
      const id = env.GAME_ROOM.idFromName('host-transfer');
      const stub = env.GAME_ROOM.get(id);

      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        await instance.initialize('TRAN01');

        const wsHost = createMockWebSocket();
        await instance.webSocketMessage(
          wsHost,
          JSON.stringify({
            type: 'join_room',
            payload: { roomCode: 'TRAN01', playerName: 'Host' },
          })
        );

        const wsPlayer = createMockWebSocket();
        await instance.webSocketMessage(
          wsPlayer,
          JSON.stringify({
            type: 'join_room',
            payload: { roomCode: 'TRAN01', playerName: 'Player' },
          })
        );

        await instance.webSocketMessage(
          wsHost,
          JSON.stringify({
            type: 'leave_room',
            payload: {},
          })
        );

        const hostTransferMessages = getMessagesByType(wsPlayer, 'host_transferred');
        expect(hostTransferMessages).toHaveLength(1);

        const roomState = await state.storage.get<any>('state');
        const players = Object.values(roomState.players) as any[];
        expect(players).toHaveLength(1);
        expect(players[0].isHost).toBe(true);
      });
    });
  });

  describe('Reconnection', () => {
    it('allows reconnection with valid session token', async () => {
      const id = env.GAME_ROOM.idFromName('reconnect-test');
      const stub = env.GAME_ROOM.get(id);

      await runInDurableObject(stub, async (instance: GameRoom) => {
        await instance.initialize('RECO01');

        const ws1 = createMockWebSocket();
        await instance.webSocketMessage(
          ws1,
          JSON.stringify({
            type: 'join_room',
            payload: { roomCode: 'RECO01', playerName: 'Alice' },
          })
        );

        const joinResponse = getMessagesByType(ws1, 'room_joined')[0];
        const sessionToken = joinResponse.payload.sessionToken;

        const ws2 = createMockWebSocket();
        await instance.webSocketMessage(
          ws2,
          JSON.stringify({
            type: 'reconnect',
            payload: { roomCode: 'RECO01', sessionToken },
          })
        );

        const reconnectMessages = getMessagesByType(ws2, 'reconnect_success');
        expect(reconnectMessages).toHaveLength(1);
        expect(reconnectMessages[0].payload.gameState).toBe('lobby');
      });
    });

    it('rejects reconnection with invalid session token', async () => {
      const id = env.GAME_ROOM.idFromName('reconnect-invalid');
      const stub = env.GAME_ROOM.get(id);

      await runInDurableObject(stub, async (instance: GameRoom) => {
        await instance.initialize('INVA01');

        const ws1 = createMockWebSocket();
        await instance.webSocketMessage(
          ws1,
          JSON.stringify({
            type: 'join_room',
            payload: { roomCode: 'INVA01', playerName: 'Alice' },
          })
        );

        const ws2 = createMockWebSocket();
        await instance.webSocketMessage(
          ws2,
          JSON.stringify({
            type: 'reconnect',
            payload: { roomCode: 'INVA01', sessionToken: 'invalid-token' },
          })
        );

        const errorMessages = getMessagesByType(ws2, 'error');
        expect(errorMessages.some((m) => m.payload.code === 'INVALID_SESSION')).toBe(true);
      });
    });
  });

  describe('AI Service', () => {
    it('fallback scenario has correct structure', () => {
      const scenario = getFallbackScenario();

      expect(scenario.prompt).toBeDefined();
      expect(scenario.prompt.length).toBeGreaterThan(20);
      expect(scenario.fragments).toHaveLength(4);
      expect(scenario.hints).toHaveLength(4);
      expect(scenario.detailQuestions).toHaveLength(5);
    });

    it('fragments are more specific than hints', () => {
      const scenario = getFallbackScenario();

      const fragmentsText = scenario.fragments.join(' ');
      const hintsText = scenario.hints.join(' ');

      expect(fragmentsText.length).toBeGreaterThan(hintsText.length);
    });
  });

  describe('Ping/Pong', () => {
    it('responds to ping with pong', async () => {
      const id = env.GAME_ROOM.idFromName('ping-test');
      const stub = env.GAME_ROOM.get(id);

      await runInDurableObject(stub, async (instance: GameRoom) => {
        await instance.initialize('PING01');

        const ws = createMockWebSocket();
        await instance.webSocketMessage(
          ws,
          JSON.stringify({
            type: 'join_room',
            payload: { roomCode: 'PING01', playerName: 'Alice' },
          })
        );

        const clientTime = Date.now();
        await instance.webSocketMessage(
          ws,
          JSON.stringify({
            type: 'ping',
            payload: { clientTime },
          })
        );

        const pongMessages = getMessagesByType(ws, 'pong');
        expect(pongMessages).toHaveLength(1);
        expect(pongMessages[0].payload.serverTime).toBeGreaterThanOrEqual(clientTime);
      });
    });
  });

  describe('Full Game Flow', () => {
    it('completes a full round with detail submission and voting', async () => {
      const id = env.GAME_ROOM.idFromName('full-round');
      const stub = env.GAME_ROOM.get(id);

      const players: any[] = [];
      let playerIds: string[] = [];
      let witnessId: string;

      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        await instance.initialize('FULL01');

        for (let i = 0; i < 3; i++) {
          const ws = createMockWebSocket();
          await instance.webSocketMessage(
            ws,
            JSON.stringify({
              type: 'join_room',
              payload: { roomCode: 'FULL01', playerName: `Player${i}` },
            })
          );
          await instance.webSocketMessage(
            ws,
            JSON.stringify({
              type: 'set_ready',
              payload: { ready: true },
            })
          );
          const joinMsg = getMessagesByType(ws, 'room_joined')[0];
          playerIds.push(joinMsg.payload.playerId);
          players.push(ws);
        }

        await instance.webSocketMessage(
          players[0],
          JSON.stringify({
            type: 'start_game',
            payload: {},
          })
        );

        const roomState = await state.storage.get<any>('state');
        expect(roomState.currentPhase).toBe('memory');
        witnessId = roomState.roundData.witnessId;
      });

      await runDurableObjectAlarm(stub);
      await runInDurableObject(stub, async (_instance: GameRoom, state) => {
        const roomState = await state.storage.get<any>('state');
        expect(roomState.currentPhase).toBe('roles');
      });

      await runDurableObjectAlarm(stub);
      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        const roomState = await state.storage.get<any>('state');
        expect(roomState.currentPhase).toBe('details');

        for (let i = 0; i < 3; i++) {
          await instance.webSocketMessage(
            players[i],
            JSON.stringify({
              type: 'submit_detail',
              payload: { answer: `Answer from player ${i}` },
            })
          );
        }

        const updatedState = await state.storage.get<any>('state');
        expect(updatedState.currentPhase).toBe('questions');
        expect(Object.keys(updatedState.roundData.playerDetails)).toHaveLength(3);
      });

      await runDurableObjectAlarm(stub);
      await runInDurableObject(stub, async (_instance: GameRoom, state) => {
        const roomState = await state.storage.get<any>('state');
        expect(roomState.currentPhase).toBe('voting');
      });

      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        const roomState = await state.storage.get<any>('state');
        witnessId = roomState.roundData.witnessId;

        for (let i = 0; i < 3; i++) {
          const isWitness = playerIds[i] === witnessId;
          const targetId = isWitness
            ? playerIds.find((id) => id !== witnessId)!
            : witnessId;

          await instance.webSocketMessage(
            players[i],
            JSON.stringify({
              type: 'cast_vote',
              payload: { targetPlayerId: targetId },
            })
          );
        }

        const updatedState = await state.storage.get<any>('state');
        expect(updatedState.currentPhase).toBe('results');
      });

      await runInDurableObject(stub, async (_instance: GameRoom, _state) => {
        const resultsMessages = getMessagesByType(players[0], 'round_results');
        expect(resultsMessages.length).toBeGreaterThan(0);

        const results = resultsMessages[resultsMessages.length - 1].payload;
        expect(results.roundNumber).toBe(1);
        expect(results.witnessIds).toContain(witnessId);
        expect(results.fragments).toHaveLength(4);
        expect(Object.keys(results.votes).length).toBe(3);
      });
    });

    it('awards 10 points for correctly identifying witness', async () => {
      const id = env.GAME_ROOM.idFromName('score-correct');
      const stub = env.GAME_ROOM.get(id);

      const players: any[] = [];
      let playerIds: string[] = [];
      let witnessId: string;

      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        await instance.initialize('SCOR01');

        for (let i = 0; i < 3; i++) {
          const ws = createMockWebSocket();
          await instance.webSocketMessage(
            ws,
            JSON.stringify({
              type: 'join_room',
              payload: { roomCode: 'SCOR01', playerName: `Player${i}` },
            })
          );
          await instance.webSocketMessage(
            ws,
            JSON.stringify({
              type: 'set_ready',
              payload: { ready: true },
            })
          );
          const joinMsg = getMessagesByType(ws, 'room_joined')[0];
          playerIds.push(joinMsg.payload.playerId);
          players.push(ws);
        }

        await instance.webSocketMessage(
          players[0],
          JSON.stringify({
            type: 'start_game',
            payload: {},
          })
        );

        const roomState = await state.storage.get<any>('state');
        witnessId = roomState.roundData.witnessId;
      });

      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);

      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        const roomState = await state.storage.get<any>('state');
        expect(roomState.currentPhase).toBe('voting');
        witnessId = roomState.roundData.witnessId;

        for (let i = 0; i < 3; i++) {
          const isWitness = playerIds[i] === witnessId;
          const targetId = isWitness
            ? playerIds.find((id) => id !== witnessId)!
            : witnessId;

          await instance.webSocketMessage(
            players[i],
            JSON.stringify({
              type: 'cast_vote',
              payload: { targetPlayerId: targetId },
            })
          );
        }
      });

      await runInDurableObject(stub, async (_instance: GameRoom, _state) => {
        const resultsMessages = getMessagesByType(players[0], 'round_results');
        const results = resultsMessages[resultsMessages.length - 1].payload;

        for (const [voterId, points] of Object.entries(results.roundScores) as [string, number][]) {
          if (voterId !== witnessId && results.votes[voterId] === witnessId) {
            expect(points).toBe(10);
          }
        }
      });
    });

    it('awards witness points for fooling players', async () => {
      const id = env.GAME_ROOM.idFromName('score-fool');
      const stub = env.GAME_ROOM.get(id);

      const players: any[] = [];
      let playerIds: string[] = [];
      let witnessId: string;

      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        await instance.initialize('FOOL01');

        for (let i = 0; i < 3; i++) {
          const ws = createMockWebSocket();
          await instance.webSocketMessage(
            ws,
            JSON.stringify({
              type: 'join_room',
              payload: { roomCode: 'FOOL01', playerName: `Player${i}` },
            })
          );
          await instance.webSocketMessage(
            ws,
            JSON.stringify({
              type: 'set_ready',
              payload: { ready: true },
            })
          );
          const joinMsg = getMessagesByType(ws, 'room_joined')[0];
          playerIds.push(joinMsg.payload.playerId);
          players.push(ws);
        }

        await instance.webSocketMessage(
          players[0],
          JSON.stringify({
            type: 'start_game',
            payload: {},
          })
        );

        const roomState = await state.storage.get<any>('state');
        witnessId = roomState.roundData.witnessId;
      });

      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);

      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        const roomState = await state.storage.get<any>('state');
        witnessId = roomState.roundData.witnessId;
        const nonWitnessId = playerIds.find((id) => id !== witnessId)!;
        const otherNonWitnessId = playerIds.find((id) => id !== witnessId && id !== nonWitnessId);

        for (let i = 0; i < 3; i++) {
          const targetId = playerIds[i] === nonWitnessId
            ? (otherNonWitnessId || witnessId)
            : nonWitnessId;

          await instance.webSocketMessage(
            players[i],
            JSON.stringify({
              type: 'cast_vote',
              payload: { targetPlayerId: targetId },
            })
          );
        }
      });

      await runInDurableObject(stub, async (_instance: GameRoom, _state) => {
        const resultsMessages = getMessagesByType(players[0], 'round_results');
        const results = resultsMessages[resultsMessages.length - 1].payload;

        expect(results.roundScores[witnessId]).toBeGreaterThan(0);
      });
    });

    it('prevents self-voting', async () => {
      const id = env.GAME_ROOM.idFromName('no-self-vote');
      const stub = env.GAME_ROOM.get(id);

      const players: any[] = [];
      let playerIds: string[] = [];

      await runInDurableObject(stub, async (instance: GameRoom) => {
        await instance.initialize('SELF01');

        for (let i = 0; i < 3; i++) {
          const ws = createMockWebSocket();
          await instance.webSocketMessage(
            ws,
            JSON.stringify({
              type: 'join_room',
              payload: { roomCode: 'SELF01', playerName: `Player${i}` },
            })
          );
          await instance.webSocketMessage(
            ws,
            JSON.stringify({
              type: 'set_ready',
              payload: { ready: true },
            })
          );
          const joinMsg = getMessagesByType(ws, 'room_joined')[0];
          playerIds.push(joinMsg.payload.playerId);
          players.push(ws);
        }

        await instance.webSocketMessage(
          players[0],
          JSON.stringify({
            type: 'start_game',
            payload: {},
          })
        );
      });

      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);

      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        await instance.webSocketMessage(
          players[0],
          JSON.stringify({
            type: 'cast_vote',
            payload: { targetPlayerId: playerIds[0] },
          })
        );

        const roomState = await state.storage.get<any>('state');
        expect(Object.keys(roomState.roundData.votes)).toHaveLength(0);
      });
    });

    it('prevents double voting', async () => {
      const id = env.GAME_ROOM.idFromName('no-double-vote');
      const stub = env.GAME_ROOM.get(id);

      const players: any[] = [];
      let playerIds: string[] = [];

      await runInDurableObject(stub, async (instance: GameRoom) => {
        await instance.initialize('DBLV01');

        for (let i = 0; i < 3; i++) {
          const ws = createMockWebSocket();
          await instance.webSocketMessage(
            ws,
            JSON.stringify({
              type: 'join_room',
              payload: { roomCode: 'DBLV01', playerName: `Player${i}` },
            })
          );
          await instance.webSocketMessage(
            ws,
            JSON.stringify({
              type: 'set_ready',
              payload: { ready: true },
            })
          );
          const joinMsg = getMessagesByType(ws, 'room_joined')[0];
          playerIds.push(joinMsg.payload.playerId);
          players.push(ws);
        }

        await instance.webSocketMessage(
          players[0],
          JSON.stringify({
            type: 'start_game',
            payload: {},
          })
        );
      });

      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);

      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        await instance.webSocketMessage(
          players[0],
          JSON.stringify({
            type: 'cast_vote',
            payload: { targetPlayerId: playerIds[1] },
          })
        );

        await instance.webSocketMessage(
          players[0],
          JSON.stringify({
            type: 'cast_vote',
            payload: { targetPlayerId: playerIds[2] },
          })
        );

        const roomState = await state.storage.get<any>('state');
        expect(Object.keys(roomState.roundData.votes)).toHaveLength(1);
        expect(roomState.roundData.votes[playerIds[0]]).toBe(playerIds[1]);
      });
    });

    it('advances to next round when host continues', async () => {
      const id = env.GAME_ROOM.idFromName('next-round');
      const stub = env.GAME_ROOM.get(id);

      const players: any[] = [];
      let playerIds: string[] = [];
      let witnessId: string;

      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        await instance.initialize('NEXT01');

        for (let i = 0; i < 3; i++) {
          const ws = createMockWebSocket();
          await instance.webSocketMessage(
            ws,
            JSON.stringify({
              type: 'join_room',
              payload: { roomCode: 'NEXT01', playerName: `Player${i}` },
            })
          );
          await instance.webSocketMessage(
            ws,
            JSON.stringify({
              type: 'set_ready',
              payload: { ready: true },
            })
          );
          const joinMsg = getMessagesByType(ws, 'room_joined')[0];
          playerIds.push(joinMsg.payload.playerId);
          players.push(ws);
        }

        await instance.webSocketMessage(
          players[0],
          JSON.stringify({
            type: 'start_game',
            payload: {},
          })
        );

        const roomState = await state.storage.get<any>('state');
        witnessId = roomState.roundData.witnessId;
      });

      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);

      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        const roomState = await state.storage.get<any>('state');
        witnessId = roomState.roundData.witnessId;

        for (let i = 0; i < 3; i++) {
          const isWitness = playerIds[i] === witnessId;
          const targetId = isWitness
            ? playerIds.find((id) => id !== witnessId)!
            : witnessId;

          await instance.webSocketMessage(
            players[i],
            JSON.stringify({
              type: 'cast_vote',
              payload: { targetPlayerId: targetId },
            })
          );
        }

        const updatedState = await state.storage.get<any>('state');
        expect(updatedState.currentPhase).toBe('results');
        expect(updatedState.currentRound).toBe(1);

        await instance.webSocketMessage(
          players[0],
          JSON.stringify({
            type: 'continue_game',
            payload: {},
          })
        );

        const finalState = await state.storage.get<any>('state');
        expect(finalState.currentRound).toBe(2);
        expect(finalState.currentPhase).toBe('memory');
      });
    });

    it('ends game after final round', async () => {
      const id = env.GAME_ROOM.idFromName('game-end');
      const stub = env.GAME_ROOM.get(id);

      const players: any[] = [];
      let playerIds: string[] = [];
      let witnessId: string;

      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        await instance.initialize('ENDG01');

        const roomState = await state.storage.get<any>('state');
        roomState.config.rounds = 1;
        await state.storage.put('state', roomState);
        await instance.initialize('ENDG01');

        for (let i = 0; i < 3; i++) {
          const ws = createMockWebSocket();
          await instance.webSocketMessage(
            ws,
            JSON.stringify({
              type: 'join_room',
              payload: { roomCode: 'ENDG01', playerName: `Player${i}` },
            })
          );
          await instance.webSocketMessage(
            ws,
            JSON.stringify({
              type: 'set_ready',
              payload: { ready: true },
            })
          );
          const joinMsg = getMessagesByType(ws, 'room_joined')[0];
          playerIds.push(joinMsg.payload.playerId);
          players.push(ws);
        }

        await instance.webSocketMessage(
          players[0],
          JSON.stringify({
            type: 'start_game',
            payload: {},
          })
        );

        const startedState = await state.storage.get<any>('state');
        witnessId = startedState.roundData.witnessId;
      });

      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);

      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        const roomState = await state.storage.get<any>('state');
        witnessId = roomState.roundData.witnessId;

        for (let i = 0; i < 3; i++) {
          const isWitness = playerIds[i] === witnessId;
          const targetId = isWitness
            ? playerIds.find((id) => id !== witnessId)!
            : witnessId;

          await instance.webSocketMessage(
            players[i],
            JSON.stringify({
              type: 'cast_vote',
              payload: { targetPlayerId: targetId },
            })
          );
        }

        await instance.webSocketMessage(
          players[0],
          JSON.stringify({
            type: 'continue_game',
            payload: {},
          })
        );

        const finalState = await state.storage.get<any>('state');
        expect(finalState.gameState).toBe('finished');
      });

      await runInDurableObject(stub, async (_instance: GameRoom, _state) => {
        const gameFinishedMessages = getMessagesByType(players[0], 'game_finished');
        expect(gameFinishedMessages.length).toBeGreaterThan(0);

        const finished = gameFinishedMessages[gameFinishedMessages.length - 1].payload;
        expect(finished.reason).toBe('completed');
        expect(finished.winner).toBeDefined();
        expect(finished.winner.id).toBeDefined();
        expect(finished.finalScores).toBeDefined();
      });
    });

    it('accumulates scores across multiple rounds', async () => {
      const id = env.GAME_ROOM.idFromName('multi-round');
      const stub = env.GAME_ROOM.get(id);

      const players: any[] = [];
      let playerIds: string[] = [];
      let witnessId: string;

      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        await instance.initialize('MULT01');

        const roomState = await state.storage.get<any>('state');
        roomState.config.rounds = 2;
        await state.storage.put('state', roomState);
        await instance.initialize('MULT01');

        for (let i = 0; i < 3; i++) {
          const ws = createMockWebSocket();
          await instance.webSocketMessage(
            ws,
            JSON.stringify({
              type: 'join_room',
              payload: { roomCode: 'MULT01', playerName: `Player${i}` },
            })
          );
          await instance.webSocketMessage(
            ws,
            JSON.stringify({
              type: 'set_ready',
              payload: { ready: true },
            })
          );
          const joinMsg = getMessagesByType(ws, 'room_joined')[0];
          playerIds.push(joinMsg.payload.playerId);
          players.push(ws);
        }

        await instance.webSocketMessage(
          players[0],
          JSON.stringify({
            type: 'start_game',
            payload: {},
          })
        );

        const startedState = await state.storage.get<any>('state');
        witnessId = startedState.roundData.witnessId;
      });

      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);

      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        const roomState = await state.storage.get<any>('state');
        witnessId = roomState.roundData.witnessId;

        for (let i = 0; i < 3; i++) {
          const isWitness = playerIds[i] === witnessId;
          const targetId = isWitness
            ? playerIds.find((id) => id !== witnessId)!
            : witnessId;

          await instance.webSocketMessage(
            players[i],
            JSON.stringify({
              type: 'cast_vote',
              payload: { targetPlayerId: targetId },
            })
          );
        }
      });

      let round1Scores: Record<string, number> = {};
      await runInDurableObject(stub, async (_instance: GameRoom, _state) => {
        const resultsMessages = getMessagesByType(players[0], 'round_results');
        const results = resultsMessages[resultsMessages.length - 1].payload;
        round1Scores = results.totalScores;
      });

      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        await instance.webSocketMessage(
          players[0],
          JSON.stringify({
            type: 'continue_game',
            payload: {},
          })
        );

        const roomState = await state.storage.get<any>('state');
        expect(roomState.currentRound).toBe(2);
      });

      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);
      await runDurableObjectAlarm(stub);

      await runInDurableObject(stub, async (instance: GameRoom, state) => {
        const roomState = await state.storage.get<any>('state');
        witnessId = roomState.roundData.witnessId;

        for (let i = 0; i < 3; i++) {
          const isWitness = playerIds[i] === witnessId;
          const targetId = isWitness
            ? playerIds.find((id) => id !== witnessId)!
            : witnessId;

          await instance.webSocketMessage(
            players[i],
            JSON.stringify({
              type: 'cast_vote',
              payload: { targetPlayerId: targetId },
            })
          );
        }
      });

      await runInDurableObject(stub, async (_instance: GameRoom, _state) => {
        const resultsMessages = getMessagesByType(players[0], 'round_results');
        const results = resultsMessages[resultsMessages.length - 1].payload;

        for (const playerId of playerIds) {
          expect(results.totalScores[playerId]).toBeGreaterThanOrEqual(round1Scores[playerId] || 0);
        }
      });
    });
  });
});
