import { Show, For, createMemo } from 'solid-js';
import { cn } from '../lib/cn';
import { createVoiceChat, type VoiceParticipant } from '../lib/voice';
import { game } from '../stores/game';

interface VoiceChatProps {
  roomCode: string;
}

export default function VoiceChat(props: VoiceChatProps) {
  const voice = createVoiceChat(
    props.roomCode,
    game.playerId || '',
    game.players.find((p) => p.id === game.playerId)?.name || ''
  );

  const localParticipant = createMemo(() => {
    const participants = voice.state().participants;
    const me = participants.find(p => p.odName === game.players.find(pl => pl.id === game.playerId)?.name);
    return me;
  });

  const otherParticipants = createMemo(() => {
    const myName = game.players.find(pl => pl.id === game.playerId)?.name;
    return voice.state().participants.filter(p => p.odName !== myName);
  });

  const handleJoinVoice = async () => {
    await voice.connect();
  };

  const handleLeaveVoice = () => {
    voice.disconnect();
  };

  return (
    <div class="fixed bottom-4 right-4 z-40">
      <Show
        when={voice.state().isConnected}
        fallback={
          <button
            type="button"
            onClick={handleJoinVoice}
            disabled={voice.state().isConnecting}
            class={cn(
              'flex items-center gap-2 bg-background border border-border px-4 py-3',
              'text-sm text-muted hover:text-text hover:border-text/30 transition-all',
              voice.state().isConnecting && 'opacity-50 cursor-wait'
            )}
          >
            <Show
              when={!voice.state().isConnecting}
              fallback={
                <svg class="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              }
            >
              <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </Show>
            <span>{voice.state().isConnecting ? 'Connecting...' : 'Join Voice'}</span>
          </button>
        }
      >
        <div class="flex flex-col bg-background border border-border overflow-hidden w-56">
          <div class="px-3 py-2 border-b border-border flex items-center justify-between">
            <span class="text-xs font-medium uppercase tracking-wider text-muted">Voice</span>
            <button
              type="button"
              onClick={handleLeaveVoice}
              class="text-muted hover:text-imposter transition-colors"
            >
              <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="flex flex-col divide-y divide-border/50">
            <Show when={localParticipant()}>
              <ParticipantRow 
                participant={localParticipant()!} 
                isLocal={true}
                isMuted={voice.state().isMuted}
                onToggleMute={() => voice.toggleMute()}
              />
            </Show>

            <For each={otherParticipants()}>
              {(participant) => (
                <ParticipantRow participant={participant} isLocal={false} />
              )}
            </For>
          </div>

          <Show when={voice.state().participants.length === 0}>
            <div class="px-3 py-4 text-center">
              <p class="text-xs text-muted">Connecting to voice...</p>
            </div>
          </Show>

          <Show when={voice.state().error}>
            <div class="px-3 py-2 bg-imposter/5 border-t border-imposter/20">
              <p class="text-xs text-imposter">{voice.state().error}</p>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}

interface ParticipantRowProps {
  participant: VoiceParticipant;
  isLocal: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

function ParticipantRow(props: ParticipantRowProps) {
  return (
    <div class={cn(
      'flex items-center gap-3 px-3 py-2.5',
      props.participant.isSpeaking && 'bg-success/5'
    )}>
      <div class="relative">
        <div class={cn(
          'size-8 flex items-center justify-center text-xs font-medium',
          'bg-surface border border-border',
          props.participant.isSpeaking && 'border-success ring-2 ring-success/20'
        )}>
          {props.participant.odName.charAt(0).toUpperCase()}
        </div>
        <Show when={props.participant.isSpeaking}>
          <span class="absolute -bottom-0.5 -right-0.5 size-2.5 bg-success rounded-full animate-pulse" />
        </Show>
      </div>

      <div class="flex-1 min-w-0">
        <p class={cn(
          'text-sm truncate',
          props.participant.isSpeaking ? 'text-text font-medium' : 'text-muted'
        )}>
          {props.participant.odName}
          <Show when={props.isLocal}>
            <span class="text-muted font-normal"> (you)</span>
          </Show>
        </p>
      </div>

      <Show when={props.isLocal && props.onToggleMute}>
        <button
          type="button"
          onClick={props.onToggleMute}
          class={cn(
            'size-7 flex items-center justify-center transition-colors',
            props.isMuted 
              ? 'text-imposter bg-imposter/10 hover:bg-imposter/20' 
              : 'text-muted hover:text-text hover:bg-surface'
          )}
        >
          <Show
            when={!props.isMuted}
            fallback={
              <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <line x1="2" x2="22" y1="2" y2="22" />
                <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
                <path d="M5 10v2a7 7 0 0 0 12 5" />
                <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            }
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </Show>
        </button>
      </Show>

      <Show when={!props.isLocal && props.participant.isMuted}>
        <div class="size-7 flex items-center justify-center text-muted/50">
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="2" x2="22" y1="2" y2="22" />
            <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
            <path d="M5 10v2a7 7 0 0 0 12 5" />
            <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </div>
      </Show>
    </div>
  );
}
