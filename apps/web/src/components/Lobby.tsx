import { createSignal, For, Show, createMemo } from 'solid-js';
import { cn } from '../lib/cn';
import { game } from '../stores/game';
import { setReady, startGame } from '../lib/game-client';

interface LobbyProps {
  roomCode: string;
}

const AVATAR_COLORS = [
  { bg: 'bg-amber-500/20', text: 'text-amber-400', ring: 'ring-amber-500/30' },
  { bg: 'bg-emerald-500/20', text: 'text-emerald-400', ring: 'ring-emerald-500/30' },
  { bg: 'bg-sky-500/20', text: 'text-sky-400', ring: 'ring-sky-500/30' },
  { bg: 'bg-rose-500/20', text: 'text-rose-400', ring: 'ring-rose-500/30' },
  { bg: 'bg-violet-500/20', text: 'text-violet-400', ring: 'ring-violet-500/30' },
  { bg: 'bg-cyan-500/20', text: 'text-cyan-400', ring: 'ring-cyan-500/30' },
  { bg: 'bg-orange-500/20', text: 'text-orange-400', ring: 'ring-orange-500/30' },
  { bg: 'bg-pink-500/20', text: 'text-pink-400', ring: 'ring-pink-500/30' },
];

function getAvatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export default function Lobby(props: LobbyProps) {
  const [copied, setCopied] = createSignal(false);

  const readyCount = createMemo(() => game.players.filter((p) => p.isReady).length);
  const canStartGame = createMemo(() => game.isHost && readyCount() >= 3);
  const currentPlayer = createMemo(() => game.players.find((p) => p.id === game.playerId));

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(props.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleToggleReady = () => {
    const player = currentPlayer();
    if (!player) return;
    setReady(!player.isReady);
  };

  const handleStartGame = () => {
    if (!canStartGame()) return;
    startGame();
  };

  return (
    <div class="noise-texture flex min-h-dvh flex-col bg-background px-5 py-8 md:px-6 md:py-10">
      <div class="mx-auto flex w-full max-w-lg flex-1 flex-col gap-10">
        <header class="flex flex-col gap-8">
          <div class="flex items-center justify-between">
            <h1 class="title-dramatic text-2xl text-text">
              DÉJÀ VU
            </h1>
            <div class="flex items-center gap-1.5 rounded-full bg-surface-elevated px-3 py-1.5">
              <span class="text-sm font-medium tabular-nums text-text">{game.players.length}</span>
              <span class="text-muted">/</span>
              <span class="text-sm tabular-nums text-muted">{game.config?.maxPlayers ?? 8}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            class={cn(
              'card-elevated group flex flex-col items-center gap-4 rounded-2xl bg-surface p-8',
              'transition-all duration-150'
            )}
          >
            <span class="text-xs font-medium uppercase tracking-[0.2em] text-muted">
              Room Code
            </span>
            <div class="flex items-center gap-4">
              <span class="room-code-display text-4xl font-light text-text md:text-5xl">
                {props.roomCode}
              </span>
            </div>
            <div class="flex items-center gap-2 text-sm text-muted transition-colors duration-100 group-hover:text-text">
              <Show
                when={copied()}
                fallback={
                  <>
                    <svg
                      class="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>Tap to copy</span>
                  </>
                }
              >
                <svg
                  class="h-4 w-4 text-success"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span class="text-success">Copied!</span>
              </Show>
            </div>
          </button>
        </header>

        <section class="flex flex-1 flex-col gap-5">
          <div class="flex items-center justify-between px-1">
            <h2 class="text-xs font-medium uppercase tracking-[0.15em] text-muted">Players</h2>
            <div class="flex items-center gap-2">
              <span class="inline-block h-2 w-2 rounded-full bg-success" />
              <span class="text-xs tabular-nums text-muted">
                {readyCount()} ready
              </span>
            </div>
          </div>

          <ul class="flex flex-col gap-2">
            <For each={game.players}>
              {(player, index) => {
                const color = getAvatarColor(index());
                const isYou = player.id === game.playerId;
                return (
                  <li
                    class={cn(
                      'card-elevated flex min-h-16 items-center justify-between rounded-xl bg-surface px-4',
                      isYou && 'ring-1 ring-witness/20'
                    )}
                  >
                    <div class="flex items-center gap-4">
                      <div
                        class={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold',
                          player.isReady ? 'ring-2' : '',
                          color.bg,
                          color.text,
                          player.isReady && color.ring
                        )}
                      >
                        {player.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div class="flex flex-col gap-0.5">
                        <div class="flex items-center gap-2">
                          <span class="font-medium text-text">{player.name}</span>
                          <Show when={player.isHost}>
                            <span class="rounded-md bg-witness/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-witness">
                              Host
                            </span>
                          </Show>
                          <Show when={isYou}>
                            <span class="text-xs text-muted">(you)</span>
                          </Show>
                        </div>
                        <Show when={player.connectionStatus !== 'connected'}>
                          <span class="text-xs text-witness">{player.connectionStatus}</span>
                        </Show>
                      </div>
                    </div>
                    <div class="flex items-center">
                      <Show when={player.isReady}>
                        <span class="flex items-center gap-1.5 text-xs font-medium text-success">
                          <span class="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                          Ready
                        </span>
                      </Show>
                      <Show when={!player.isReady}>
                        <span class="text-xs text-muted/60">Waiting...</span>
                      </Show>
                    </div>
                  </li>
                );
              }}
            </For>
          </ul>

          <Show when={game.players.length === 0}>
            <div class="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-16">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated">
                <svg class="h-6 w-6 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div class="flex flex-col items-center gap-1 text-center">
                <p class="text-sm font-medium text-text">No players yet</p>
                <p class="text-xs text-muted">Share the room code to invite others</p>
              </div>
            </div>
          </Show>

          <Show when={game.players.length > 0 && game.players.length < 3}>
            <div class="flex items-center gap-3 rounded-xl bg-surface-elevated px-4 py-3">
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-witness/10">
                <svg class="h-4 w-4 text-witness" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p class="text-xs text-muted">
                Need at least <span class="font-medium text-text">3 players</span> to start the game
              </p>
            </div>
          </Show>
        </section>

        <footer class="flex flex-col gap-3">
          <Show when={currentPlayer()}>
            <button
              type="button"
              onClick={handleToggleReady}
              class={cn(
                'flex h-13 items-center justify-center rounded-xl text-base font-semibold',
                'transition-all duration-100',
                currentPlayer()?.isReady
                  ? 'btn-secondary'
                  : 'btn-primary'
              )}
            >
              {currentPlayer()?.isReady ? 'Cancel Ready' : 'Ready Up'}
            </button>
          </Show>

          <Show when={game.isHost}>
            <button
              type="button"
              onClick={handleStartGame}
              disabled={!canStartGame()}
              class={cn(
                'btn-witness flex h-13 items-center justify-center rounded-xl text-base font-semibold',
                'disabled:cursor-not-allowed disabled:opacity-30'
              )}
            >
              <Show
                when={canStartGame()}
                fallback={
                  <span class="flex items-center gap-2">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Need {Math.max(0, 3 - readyCount())} more ready
                  </span>
                }
              >
                Start Game
              </Show>
            </button>
          </Show>
        </footer>
      </div>
    </div>
  );
}
