import { Show, createSignal, createEffect, onCleanup, For } from 'solid-js';
import { cn } from '../lib/cn';
import { createVoiceChat } from '../lib/voice';
import { game } from '../stores/game';

interface VoiceChatProps {
  roomCode: string;
}

export default function VoiceChat(props: VoiceChatProps) {
  const [isExpanded, setIsExpanded] = createSignal(false);
  const [hasPermission, setHasPermission] = createSignal<boolean | null>(null);

  const voice = createVoiceChat(
    props.roomCode,
    game.playerId || '',
    game.players.find((p) => p.id === game.playerId)?.name || ''
  );

  createEffect(() => {
    const state = voice.state();
    if (state.permissionState === 'granted') {
      setHasPermission(true);
    } else if (state.permissionState === 'denied') {
      setHasPermission(false);
    }
  });

  const handleJoinVoice = async () => {
    await voice.connect();
    voice.unmute();
  };

  const handleLeaveVoice = () => {
    voice.disconnect();
  };

  return (
    <div class="fixed bottom-20 right-4 z-40">
      <Show
        when={voice.state().isConnected}
        fallback={
          <button
            type="button"
            onClick={handleJoinVoice}
            class={cn(
              'group flex items-center gap-3 border bg-surface px-4 py-3',
              'transition-all duration-200 hover:border-text/20',
              'border-border'
            )}
          >
            <div class="relative">
              <svg
                class="size-5 text-muted transition-colors group-hover:text-text"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
            <span class="text-sm font-medium text-muted transition-colors group-hover:text-text">
              Join Voice
            </span>
          </button>
        }
      >
        <div class="flex flex-col gap-2">
          <div
            class={cn(
              'flex items-center gap-3 border bg-surface px-4 py-3',
              'border-success/30 bg-success/5'
            )}
          >
            <button
              type="button"
              onClick={() => voice.toggleMute()}
              class={cn(
                'relative flex size-10 items-center justify-center transition-all duration-150',
                voice.state().isMuted
                  ? 'bg-muted/10 text-muted hover:bg-muted/20'
                  : 'bg-success/10 text-success'
              )}
            >
              <Show
                when={!voice.state().isMuted}
                fallback={
                  <svg
                    class="size-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="2" x2="22" y1="2" y2="22" />
                    <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
                    <path d="M5 10v2a7 7 0 0 0 12 5" />
                    <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                }
              >
                <svg
                  class="size-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
                <span class="absolute -right-0.5 -top-0.5 size-2 animate-pulse rounded-full bg-success" />
              </Show>
            </button>

            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-medium text-text">
                {voice.state().isMuted ? 'Muted' : 'Speaking'}
              </span>
              <span class="text-[10px] text-muted">
                {game.players.filter((p) => p.connectionStatus === 'connected').length} in voice
              </span>
            </div>

            <button
              type="button"
              onClick={handleLeaveVoice}
              class="ml-auto flex size-8 items-center justify-center text-muted transition-colors hover:text-imposter"
            >
              <svg
                class="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <Show when={voice.state().error}>
            <div class="border border-imposter/30 bg-imposter/5 px-3 py-2">
              <p class="text-xs text-imposter">{voice.state().error}</p>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
