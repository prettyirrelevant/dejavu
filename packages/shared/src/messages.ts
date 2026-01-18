import { z } from 'zod';
import type {
  ConnectionStatus,
  ErrorCode,
  GameFinishedReason,
  GameStats,
  LeaveReason,
  Phase,
  Player,
  Role,
  RoomConfig,
  RoundVoidReason,
  VoiceStatus,
  Winner,
} from './types';

const playerNameSchema = z.string().min(1).max(20).regex(/^[a-zA-Z0-9_-]+$/);
const roomCodeSchema = z.string().length(6).regex(/^[A-Z0-9]+$/);

export const CreateRoomSchema = z.object({
  type: z.literal('create_room'),
  payload: z.object({
    playerName: playerNameSchema,
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
    roomCode: roomCodeSchema,
    playerName: playerNameSchema,
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
    roomCode: roomCodeSchema,
    sessionToken: z.string(),
  }),
});

export const PingSchema = z.object({
  type: z.literal('ping'),
  payload: z.object({
    clientTime: z.number(),
  }),
});

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
    targetPlayerId: z.string(),
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
export type CreateRoomMessage = z.infer<typeof CreateRoomSchema>;
export type JoinRoomMessage = z.infer<typeof JoinRoomSchema>;
export type SetReadyMessage = z.infer<typeof SetReadySchema>;
export type StartGameMessage = z.infer<typeof StartGameSchema>;
export type LeaveRoomMessage = z.infer<typeof LeaveRoomSchema>;
export type ReconnectMessage = z.infer<typeof ReconnectSchema>;
export type PingMessage = z.infer<typeof PingSchema>;
export type SubmitDetailMessage = z.infer<typeof SubmitDetailSchema>;
export type AskQuestionMessage = z.infer<typeof AskQuestionSchema>;
export type AnswerQuestionMessage = z.infer<typeof AnswerQuestionSchema>;
export type CallVoteMessage = z.infer<typeof CallVoteSchema>;
export type CastVoteMessage = z.infer<typeof CastVoteSchema>;
export type ContinueGameMessage = z.infer<typeof ContinueGameSchema>;
export type VoiceMuteMessage = z.infer<typeof VoiceMuteSchema>;
export type VoiceDeafenMessage = z.infer<typeof VoiceDeafenSchema>;

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
    reason: LeaveReason;
  };
}

export interface PlayerReadyChangedMessage {
  type: 'player_ready_changed';
  payload: {
    playerId: string;
    ready: boolean;
  };
}

export interface PlayerConnectionChangedMessage {
  type: 'player_connection_changed';
  payload: {
    playerId: string;
    status: ConnectionStatus;
  };
}

export interface PlayerVoiceChangedMessage {
  type: 'player_voice_changed';
  payload: {
    playerId: string;
    status: VoiceStatus;
  };
}

export interface HostTransferredMessage {
  type: 'host_transferred';
  payload: {
    newHostId: string;
    newHostName: string;
    previousHostId: string;
  };
}

export interface GameStartedMessage {
  type: 'game_started';
  payload: {
    totalRounds: number;
    players: Pick<Player, 'id' | 'name'>[];
  };
}

export interface RoundStartedMessage {
  type: 'round_started';
  payload: {
    roundNumber: number;
    totalRounds: number;
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
    fragments?: string[];
    hints?: string[];
    timeRemaining: number;
  };
}

export interface DetailQuestionMessage {
  type: 'detail_question';
  payload: {
    question: string;
    timeRemaining: number;
  };
}

export interface PlayerSubmittedDetailMessage {
  type: 'player_submitted_detail';
  payload: {
    playerId: string;
    playerName: string;
  };
}

export interface DetailsRevealedMessage {
  type: 'details_revealed';
  payload: {
    details: Record<string, string>;
    timeRemaining: number;
  };
}

export interface QuestionAskedMessage {
  type: 'question_asked';
  payload: {
    questionId: string;
    fromPlayerId: string;
    fromPlayerName: string;
    toPlayerId: string;
    toPlayerName: string;
    question: string;
  };
}

export interface QuestionAnsweredMessage {
  type: 'question_answered';
  payload: {
    questionId: string;
    answer: string;
  };
}

export interface VoteCallUpdateMessage {
  type: 'vote_call_update';
  payload: {
    callerId: string;
    callerName: string;
    currentCalls: number;
    requiredCalls: number;
  };
}

export interface VotingStartedMessage {
  type: 'voting_started';
  payload: {
    timeRemaining: number;
  };
}

export interface PlayerVotedMessage {
  type: 'player_voted';
  payload: {
    playerId: string;
    playerName: string;
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

export interface RoundVoidedMessage {
  type: 'round_voided';
  payload: {
    reason: RoundVoidReason;
    message: string;
  };
}

export interface GameFinishedMessage {
  type: 'game_finished';
  payload: {
    reason: GameFinishedReason;
    finalScores: Record<string, number>;
    winner: Winner;
    stats: GameStats;
    roundsCompleted: number;
    roundsTotal: number;
  };
}

export interface PhaseTimeUpdateMessage {
  type: 'phase_time_update';
  payload: {
    timeRemaining: number;
  };
}

export interface ReconnectSuccessMessage {
  type: 'reconnect_success';
  payload: {
    gameState: string;
    currentPhase: Phase;
    roundNumber: number;
    totalRounds: number;
    yourRole?: Role;
    yourFragments?: string[];
    yourHints?: string[];
    memoryPrompt?: string;
    detailQuestion?: string;
    details?: Record<string, string>;
    witnessIds?: string[];
    witnessNames?: string[];
    timeRemaining: number;
    players: Player[];
    scores: Record<string, number>;
    phaseData: Record<string, unknown>;
    status: string;
  };
}

export interface PongMessage {
  type: 'pong';
  payload: {
    serverTime: number;
  };
}

export interface ErrorMessage {
  type: 'error';
  payload: {
    code: ErrorCode;
    message: string;
    requestId?: string;
  };
}

export interface RoomClosedMessage {
  type: 'room_closed';
  payload: {
    reason: 'timeout' | 'host_ended';
  };
}

export type ServerMessage =
  | RoomCreatedMessage
  | RoomJoinedMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | PlayerReadyChangedMessage
  | PlayerConnectionChangedMessage
  | PlayerVoiceChangedMessage
  | HostTransferredMessage
  | GameStartedMessage
  | RoundStartedMessage
  | MemoryRevealedMessage
  | RoleAssignedMessage
  | DetailQuestionMessage
  | PlayerSubmittedDetailMessage
  | DetailsRevealedMessage
  | QuestionAskedMessage
  | QuestionAnsweredMessage
  | VoteCallUpdateMessage
  | VotingStartedMessage
  | PlayerVotedMessage
  | RoundResultsMessage
  | RoundVoidedMessage
  | GameFinishedMessage
  | PhaseTimeUpdateMessage
  | ReconnectSuccessMessage
  | PongMessage
  | ErrorMessage
  | RoomClosedMessage;
