# DÉJÀ VU — Message Protocol Specification

## Overview

| Property      | Value                                    |
|---------------|------------------------------------------|
| **Transport** | WebSocket over TLS (wss://)              |
| **Format**    | JSON                                     |
| **Encoding**  | UTF-8                                    |
| **Validation**| Zod schemas (shared between client & server)|

## TypeScript Types

All types are defined in `packages/shared/src/types.ts` and validated with Zod schemas in `packages/shared/src/messages.ts`.

### Core Types

```typescript
// packages/shared/src/types.ts
import { z } from 'zod';

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
  rounds: number;           // 3, 5, or 7
  timeScale: number;        // 0.5 to 1.5
  maxPlayers: number;       // 3 to 8
  witnessCount: 'auto' | 1 | 2;
  allowSpectators: boolean;
  voiceEnabled: boolean;
}

export interface GameState {
  phase: Phase;
  round: number;
  totalRounds: number;
  players: Player[];
  spectators: Player[];
  timeRemaining: number;
}
```

---

## Base Message Structure

All messages follow this structure:

```typescript
interface BaseMessage {
  type: string;
  payload: Record<string, unknown>;
}
```

```json
{
  "type": "<message_type>",
  "payload": { }
}
```

---

## Client → Server Messages

### Zod Schemas

```typescript
// packages/shared/src/messages.ts
import { z } from 'zod';

// Lobby
export const CreateRoomSchema = z.object({
  type: z.literal('create_room'),
  payload: z.object({
    playerName: z.string().min(1).max(20).regex(/^[a-zA-Z0-9_-]+$/),
    config: z.object({
      rounds: z.union([z.literal(3), z.literal(5), z.literal(7)]),
      timeScale: z.number().min(0.5).max(1.5),
      maxPlayers: z.number().min(3).max(8),
      witnessCount: z.union([z.literal('auto'), z.literal(1), z.literal(2)]),
      allowSpectators: z.boolean(),
      voiceEnabled: z.boolean(),
    }),
  }),
});

export const JoinRoomSchema = z.object({
  type: z.literal('join_room'),
  payload: z.object({
    roomCode: z.string().length(6).regex(/^[A-Z0-9]+$/),
    playerName: z.string().min(1).max(20).regex(/^[a-zA-Z0-9_-]+$/),
    asSpectator: z.boolean().optional(),
  }),
});

export const SetReadySchema = z.object({
  type: z.literal('set_ready'),
  payload: z.object({
    ready: z.boolean(),
  }),
});

export const StartGameSchema = z.object({
  type: z.literal('start_game'),
  payload: z.object({}),
});

export const LeaveRoomSchema = z.object({
  type: z.literal('leave_room'),
  payload: z.object({}),
});

export const ReconnectSchema = z.object({
  type: z.literal('reconnect'),
  payload: z.object({
    roomCode: z.string().length(6),
    sessionToken: z.string(),
  }),
});

export const PingSchema = z.object({
  type: z.literal('ping'),
  payload: z.object({
    clientTime: z.number(),
  }),
});

// Gameplay
export const SubmitDetailSchema = z.object({
  type: z.literal('submit_detail'),
  payload: z.object({
    answer: z.string().max(280),
  }),
});

export const AskQuestionSchema = z.object({
  type: z.literal('ask_question'),
  payload: z.object({
    targetPlayerId: z.string(),
    question: z.string().max(200),
  }),
});

export const AnswerQuestionSchema = z.object({
  type: z.literal('answer_question'),
  payload: z.object({
    questionId: z.string(),
    answer: z.string().max(200),
  }),
});

export const CallVoteSchema = z.object({
  type: z.literal('call_vote'),
  payload: z.object({}),
});

export const CastVoteSchema = z.object({
  type: z.literal('cast_vote'),
  payload: z.object({
    targetPlayerId: z.string(), // or 'abstain'
  }),
});

export const ContinueGameSchema = z.object({
  type: z.literal('continue_game'),
  payload: z.object({}),
});

export const VoiceMuteSchema = z.object({
  type: z.literal('voice_mute'),
  payload: z.object({
    muted: z.boolean(),
  }),
});

export const VoiceDeafenSchema = z.object({
  type: z.literal('voice_deafen'),
  payload: z.object({
    deafened: z.boolean(),
  }),
});

// Union of all client messages
export const ClientMessageSchema = z.discriminatedUnion('type', [
  CreateRoomSchema,
  JoinRoomSchema,
  SetReadySchema,
  StartGameSchema,
  LeaveRoomSchema,
  ReconnectSchema,
  PingSchema,
  SubmitDetailSchema,
  AskQuestionSchema,
  AnswerQuestionSchema,
  CallVoteSchema,
  CastVoteSchema,
  ContinueGameSchema,
  VoiceMuteSchema,
  VoiceDeafenSchema,
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;
```

---

### Lobby / Connection

#### CreateRoom

Create a new game room as host.

```json
{
  "type": "create_room",
  "payload": {
    "playerName": "NOVA",
    "config": {
      "rounds": 5,
      "timeScale": 1.0,
      "maxPlayers": 6,
      "witnessCount": "auto",
      "allowSpectators": true,
      "voiceEnabled": true
    }
  }
}
```

#### JoinRoom

Join an existing room as player or spectator.

```json
{
  "type": "join_room",
  "payload": {
    "roomCode": "ABC123",
    "playerName": "GHOST",
    "asSpectator": false
  }
}
```

#### Reconnect

Rejoin after disconnect.

```json
{
  "type": "reconnect",
  "payload": {
    "roomCode": "ABC123",
    "sessionToken": "ABC123.p1a2b3c4.169999.hmac..."
  }
}
```

#### SetReady

Toggle ready status in lobby.

```json
{
  "type": "set_ready",
  "payload": {
    "ready": true
  }
}
```

#### StartGame (Host only)

Begin the game.

```json
{
  "type": "start_game",
  "payload": {}
}
```

#### LeaveRoom

Voluntarily leave.

```json
{
  "type": "leave_room",
  "payload": {}
}
```

#### Ping

Heartbeat (sent every 2 seconds).

```json
{
  "type": "ping",
  "payload": {
    "clientTime": 1699999999999
  }
}
```

---

### Gameplay

#### SubmitDetail

Submit answer during DETAILS phase. Max 280 characters. Can re-submit to update.

```json
{
  "type": "submit_detail",
  "payload": {
    "answer": "It was raining softly, a grey afternoon."
  }
}
```

#### AskQuestion

Ask another player a follow-up during QUESTIONS phase. Max 200 characters.

```json
{
  "type": "ask_question",
  "payload": {
    "targetPlayerId": "p2b3c4d5",
    "question": "You said grey - was it morning or evening grey?"
  }
}
```

#### AnswerQuestion

Respond to a question directed at you. Max 200 characters.

```json
{
  "type": "answer_question",
  "payload": {
    "questionId": "q1a2b3c4",
    "answer": "Evening grey, the light was fading."
  }
}
```

#### CallVote

Request to skip to voting early. Requires 50%+ of players to call before skipping.

```json
{
  "type": "call_vote",
  "payload": {}
}
```

#### CastVote

Vote for who you think is the witness. Cannot vote for self. Can change until phase ends.

```json
{
  "type": "cast_vote",
  "payload": {
    "targetPlayerId": "p1a2b3c4"
  }
}
```

Or to abstain:

```json
{
  "type": "cast_vote",
  "payload": {
    "targetPlayerId": "abstain"
  }
}
```

#### ContinueGame (Host only)

Skip results timer, proceed to next round.

```json
{
  "type": "continue_game",
  "payload": {}
}
```

#### VoiceMute

Toggle mute status.

```json
{
  "type": "voice_mute",
  "payload": {
    "muted": true
  }
}
```

#### VoiceDeafen

Toggle deafen status (mutes incoming audio).

```json
{
  "type": "voice_deafen",
  "payload": {
    "deafened": true
  }
}
```

---

## Server → Client Messages

### TypeScript Types

```typescript
// packages/shared/src/messages.ts

// Server message types (not validated with Zod on client, just typed)
export interface RoomCreatedMessage {
  type: 'room_created';
  payload: {
    roomCode: string;
    sessionToken: string;
    playerId: string;
    isHost: true;
    config: RoomConfig;
    voiceToken?: string;
  };
}

export interface RoomJoinedMessage {
  type: 'room_joined';
  payload: {
    roomCode: string;
    sessionToken: string;
    playerId: string;
    isHost: boolean;
    isSpectator: boolean;
    players: Player[];
    spectators: Player[];
    config: RoomConfig;
    voiceToken?: string;
  };
}

export interface PlayerJoinedMessage {
  type: 'player_joined';
  payload: {
    player: Player;
    isSpectator: boolean;
  };
}

export interface PlayerLeftMessage {
  type: 'player_left';
  payload: {
    playerId: string;
    playerName: string;
    reason: 'left' | 'kicked' | 'disconnected';
  };
}

export interface GameStartedMessage {
  type: 'game_started';
  payload: {
    totalRounds: number;
    players: Pick<Player, 'id' | 'name'>[];
  };
}

export interface MemoryRevealedMessage {
  type: 'memory_revealed';
  payload: {
    prompt: string;
    timeRemaining: number;
  };
}

export interface RoleAssignedMessage {
  type: 'role_assigned';
  payload: {
    role: Role;
    fragments?: string[];  // Only for witness
    hints?: string[];      // Only for imposter
    timeRemaining: number;
  };
}

export interface RoundResultsMessage {
  type: 'round_results';
  payload: {
    roundNumber: number;
    witnessIds: string[];
    witnessNames: string[];
    fragments: string[];
    votes: Record<string, string>;
    roundScores: Record<string, number>;
    totalScores: Record<string, number>;
    timeRemaining: number;
  };
}

export interface PlayerVoiceChangedMessage {
  type: 'player_voice_changed';
  payload: {
    playerId: string;
    status: VoiceStatus;
  };
}

export interface ErrorMessage {
  type: 'error';
  payload: {
    code: string;
    message: string;
    requestId?: string;
  };
}

export type ServerMessage =
  | RoomCreatedMessage
  | RoomJoinedMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | GameStartedMessage
  | MemoryRevealedMessage
  | RoleAssignedMessage
  | RoundResultsMessage
  | PlayerVoiceChangedMessage
  | ErrorMessage
  // ... other message types
  ;
```

---

### Lobby / Connection

#### RoomCreated

Response to CreateRoom.

```json
{
  "type": "room_created",
  "payload": {
    "roomCode": "ABC123",
    "sessionToken": "ABC123.p1a2b3c4.169999.hmac...",
    "playerId": "p1a2b3c4",
    "isHost": true,
    "config": { },
    "voiceToken": "eyJ..."
  }
}
```

#### RoomJoined

Response to JoinRoom.

```json
{
  "type": "room_joined",
  "payload": {
    "roomCode": "ABC123",
    "sessionToken": "ABC123.p2b3c4d5.169999.hmac...",
    "playerId": "p2b3c4d5",
    "isHost": false,
    "isSpectator": false,
    "players": [
      { "id": "p1a2b3c4", "name": "NOVA", "isHost": true, "ready": true },
      { "id": "p2b3c4d5", "name": "GHOST", "isHost": false, "ready": false }
    ],
    "spectators": [],
    "config": { },
    "voiceToken": "eyJ..."
  }
}
```

#### PlayerJoined

Broadcast when someone joins.

```json
{
  "type": "player_joined",
  "payload": {
    "player": { "id": "p3c4d5e6", "name": "CIPHER", "ready": false },
    "isSpectator": false
  }
}
```

#### PlayerLeft

Broadcast when someone leaves.

```json
{
  "type": "player_left",
  "payload": {
    "playerId": "p2b3c4d5",
    "playerName": "GHOST",
    "reason": "left"
  }
}
```

Reason can be: `"left"`, `"kicked"`, `"disconnected"`

#### PlayerReadyChanged

Broadcast when ready status changes.

```json
{
  "type": "player_ready_changed",
  "payload": {
    "playerId": "p2b3c4d5",
    "ready": true
  }
}
```

#### PlayerConnectionChanged

Broadcast when connection status changes.

```json
{
  "type": "player_connection_changed",
  "payload": {
    "playerId": "p2b3c4d5",
    "status": "degraded"
  }
}
```

Status can be: `"connected"`, `"stale"`, `"degraded"`, `"dropped"`, `"reconnecting"`

#### PlayerVoiceChanged

Broadcast when voice status changes.

```json
{
  "type": "player_voice_changed",
  "payload": {
    "playerId": "p2b3c4d5",
    "status": "muted"
  }
}
```

Status can be: `"muted"`, `"speaking"`, `"deafened"`, `"disconnected"`

#### HostTransferred

When host disconnects and role transfers.

```json
{
  "type": "host_transferred",
  "payload": {
    "newHostId": "p2b3c4d5",
    "newHostName": "GHOST",
    "previousHostId": "p1a2b3c4"
  }
}
```

#### ReconnectSuccess

Response to successful Reconnect.

```json
{
  "type": "reconnect_success",
  "payload": {
    "gameState": "playing",
    "currentPhase": "questions",
    "roundNumber": 3,
    "yourRole": "imposter",
    "yourFragments": null,
    "yourHints": ["The weather was notable"],
    "players": [],
    "scores": {},
    "phaseData": {},
    "status": "active"
  }
}
```

#### Pong

Response to Ping.

```json
{
  "type": "pong",
  "payload": {
    "serverTime": 1699999999999
  }
}
```

#### Error

Error response.

```json
{
  "type": "error",
  "payload": {
    "code": "ROOM_NOT_FOUND",
    "message": "Human-readable error message",
    "requestId": "uuid"
  }
}
```

Error codes: `ROOM_NOT_FOUND`, `ROOM_FULL`, `INVALID_ACTION`, `NOT_HOST`, `GAME_IN_PROGRESS`, `INVALID_PHASE`, `RATE_LIMITED`, `INVALID_SESSION`

---

### Gameplay

#### GameStarted

Game has begun.

```json
{
  "type": "game_started",
  "payload": {
    "totalRounds": 5,
    "players": [
      { "id": "p1a2b3c4", "name": "NOVA" },
      { "id": "p2b3c4d5", "name": "GHOST" }
    ]
  }
}
```

#### RoundStarted

New round beginning.

```json
{
  "type": "round_started",
  "payload": {
    "roundNumber": 3,
    "totalRounds": 5
  }
}
```

#### MemoryRevealed

Memory prompt shown to all.

```json
{
  "type": "memory_revealed",
  "payload": {
    "prompt": "The last day of summer. A goodbye at a train station...",
    "timeRemaining": 5000
  }
}
```

#### RoleAssigned (PRIVATE)

Your role for this round. Only sent to recipient.

**For Witness:**

```json
{
  "type": "role_assigned",
  "payload": {
    "role": "witness",
    "fragments": [
      "It was raining softly",
      "She wore a blue coat",
      "The item left behind: an umbrella"
    ],
    "timeRemaining": 5000
  }
}
```

**For Imposter:**

```json
{
  "type": "role_assigned",
  "payload": {
    "role": "imposter",
    "hints": [
      "The weather was notable",
      "Someone was wearing something memorable"
    ],
    "timeRemaining": 5000
  }
}
```

#### DetailQuestion

Question for DETAILS phase.

```json
{
  "type": "detail_question",
  "payload": {
    "question": "What was the weather like?",
    "timeRemaining": 45000
  }
}
```

#### PlayerSubmittedDetail

Someone submitted (content hidden until reveal).

```json
{
  "type": "player_submitted_detail",
  "payload": {
    "playerId": "p2b3c4d5",
    "playerName": "GHOST"
  }
}
```

#### DetailsRevealed

All answers revealed, QUESTIONS phase begins.

```json
{
  "type": "details_revealed",
  "payload": {
    "details": {
      "p1a2b3c4": "Light rain, humid, before autumn",
      "p2b3c4d5": "Sunny but cold, wind from the north",
      "p3c4d5e6": "Overcast, drizzling, grey sky"
    },
    "timeRemaining": 90000
  }
}
```

#### QuestionAsked

Someone asked a follow-up question.

```json
{
  "type": "question_asked",
  "payload": {
    "questionId": "q1a2b3c4",
    "fromPlayerId": "p2b3c4d5",
    "fromPlayerName": "GHOST",
    "toPlayerId": "p3c4d5e6",
    "toPlayerName": "CIPHER",
    "question": "You said grey sky - morning grey or evening grey?"
  }
}
```

#### QuestionAnswered

Response to a question.

```json
{
  "type": "question_answered",
  "payload": {
    "questionId": "q1a2b3c4",
    "answer": "Evening grey, the light was fading."
  }
}
```

#### VoteCallUpdate

Someone called for early vote.

```json
{
  "type": "vote_call_update",
  "payload": {
    "callerId": "p2b3c4d5",
    "callerName": "GHOST",
    "currentCalls": 2,
    "requiredCalls": 3
  }
}
```

#### VotingStarted

VOTING phase begins.

```json
{
  "type": "voting_started",
  "payload": {
    "timeRemaining": 30000
  }
}
```

#### PlayerVoted

Someone cast vote (target hidden until reveal).

```json
{
  "type": "player_voted",
  "payload": {
    "playerId": "p2b3c4d5",
    "playerName": "GHOST"
  }
}
```

#### RoundResults

Full reveal at end of round.

```json
{
  "type": "round_results",
  "payload": {
    "roundNumber": 3,
    "witnessIds": ["p1a2b3c4"],
    "witnessNames": ["NOVA"],
    "fragments": [
      "It was raining softly",
      "She wore a blue coat",
      "The item left behind: an umbrella"
    ],
    "votes": {
      "p2b3c4d5": "p1a2b3c4",
      "p3c4d5e6": "p4d5e6f7",
      "p4d5e6f7": "p1a2b3c4",
      "p1a2b3c4": "abstain"
    },
    "roundScores": {
      "p1a2b3c4": 1,
      "p2b3c4d5": 2,
      "p3c4d5e6": 1,
      "p4d5e6f7": 2
    },
    "totalScores": {
      "p1a2b3c4": 7,
      "p2b3c4d5": 9,
      "p3c4d5e6": 5,
      "p4d5e6f7": 8
    },
    "timeRemaining": 10000
  }
}
```

#### RoundVoided

Round cancelled due to witness disconnect.

```json
{
  "type": "round_voided",
  "payload": {
    "reason": "witness_disconnected",
    "message": "Round void - the witness lost connection."
  }
}
```

#### GameFinished

Game complete.

```json
{
  "type": "game_finished",
  "payload": {
    "reason": "completed",
    "finalScores": {
      "p1a2b3c4": 12,
      "p2b3c4d5": 15,
      "p3c4d5e6": 9,
      "p4d5e6f7": 8
    },
    "winner": {
      "id": "p2b3c4d5",
      "name": "GHOST",
      "score": 15
    },
    "stats": {
      "bestBluff": { "id": "p4d5e6f7", "name": "PRISM", "votesReceived": 5 },
      "bestDetective": { "id": "p2b3c4d5", "name": "GHOST", "correctGuesses": 4 },
      "sneakiestWitness": { "id": "p1a2b3c4", "name": "NOVA", "timesUndetected": 2 }
    },
    "roundsCompleted": 5,
    "roundsTotal": 5
  }
}
```

Reason can be: `"completed"`, `"insufficient_players"`, `"host_ended"`

#### PhaseTimeUpdate

Periodic time remaining update (every 5 seconds).

```json
{
  "type": "phase_time_update",
  "payload": {
    "timeRemaining": 25000
  }
}
```

---

## Validation Rules

| Field              | Constraint                                  |
|--------------------|---------------------------------------------|
| Player name        | 1-20 characters, alphanumeric + `_` + `-`   |
| Room code          | 6 uppercase alphanumeric characters         |
| Detail answer      | Max 280 characters                          |
| Question           | Max 200 characters                          |
| Answer to question | Max 200 characters                          |

## Rate Limiting

- Max 10 messages per second per client
- Exceeding = warning, then temp ban (30 seconds)

## Session Token Format

```
<RoomCode>.<PlayerId>.<Timestamp>.<HMAC>
```

Example: `ABC123.p1a2b3c4.1699999999.a1b2c3d4e5f6`

- Generated on successful join
- Valid for duration of game + 1 hour after
- Cannot be forged without server secret
