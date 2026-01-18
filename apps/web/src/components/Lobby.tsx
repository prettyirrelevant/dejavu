import { createSignal, For, Show, createMemo, Index } from 'solid-js';
import { cn } from '../lib/cn';
import { game } from '../stores/game';
import { setReady, startGame } from '../lib/game-client';
import ConnectionIndicator from './ConnectionIndicator';
import HowToPlay from './HowToPlay';

function PlayerSkeleton() {
  return (
    <li class="flex items-center justify-between border border-border bg-surface px-4 py-3">
      <div class="flex items-center gap-3">
        <div class="size-9 animate-pulse bg-muted/20" />
        <div class="flex flex-col gap-1.5">
          <div class="h-4 w-24 animate-pulse bg-muted/20" />
          <div class="h-3 w-16 animate-pulse bg-muted/20" />
        </div>
      </div>
    </li>
  );
}

interface LobbyProps {
  roomCode: string;
}

const AVATAR_COLORS = [
  { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-300' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-300' },
  { bg: 'bg-sky-100', text: 'text-sky-700', ring: 'ring-sky-300' },
  { bg: 'bg-rose-100', text: 'text-rose-700', ring: 'ring-rose-300' },
  { bg: 'bg-violet-100', text: 'text-violet-700', ring: 'ring-violet-300' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', ring: 'ring-cyan-300' },
  { bg: 'bg-orange-100', text: 'text-orange-700', ring: 'ring-orange-300' },
  { bg: 'bg-pink-100', text: 'text-pink-700', ring: 'ring-pink-300' },
];

function getAvatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export default function Lobby(props: LobbyProps) {
  const [copied, setCopied] = createSignal(false);

  const readyCount = createMemo(() => game.players.filter((p) => p.isReady).length);
  const totalPlayers = createMemo(() => game.players.length);
  const canStartGame = createMemo(() => game.isHost && readyCount() >= 3);
  const currentPlayer = createMemo(() => game.players.find((p) => p.id === game.playerId));
  const needMorePlayers = createMemo(() => totalPlayers() < 3);

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
    <main class="noise-texture notebook-margin min-h-dvh bg-background px-5 py-12 md:px-8 md:py-16">
      <div class="mx-auto flex max-w-sm flex-col gap-10">
        <header class="flex flex-col items-center gap-6 text-center">
          <button
            type="button"
            onClick={handleCopyCode}
            class="group flex flex-col items-center gap-4"
          >
            <span class="text-xs font-medium uppercase tracking-[0.3em] text-muted">
              Room Code
            </span>
            <span class="room-code-display text-5xl text-text md:text-6xl">
              {props.roomCode}
            </span>
            <span class="flex items-center gap-2 text-sm text-muted transition-colors duration-100 group-hover:text-text">
              <Show
                when={copied()}
                fallback={
                  <>
                    <svg
                      class="size-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="1" ry="1" />
                      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1" />
                    </svg>
                    <span>Tap to copy</span>
                  </>
                }
              >
                <svg
                  class="size-4 text-success"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span class="text-success">Copied!</span>
              </Show>
            </span>
          </button>
        </header>

        <section class="flex flex-col gap-4">
          <div class="flex items-center justify-between px-1">
            <span class="text-xs font-medium uppercase tracking-[0.2em] text-muted">
              Players
            </span>
            <Show when={game.synced} fallback={<div class="h-3 w-16 animate-pulse bg-muted/20" />}>
              <span class="text-xs tabular-nums text-muted">
                {readyCount()} / {totalPlayers()} ready
              </span>
            </Show>
          </div>

          <Show when={!game.synced}>
            <ul class="flex flex-col gap-2">
              <Index each={[1, 2, 3]}>{() => <PlayerSkeleton />}</Index>
            </ul>
          </Show>

          <Show when={game.synced && totalPlayers() > 0}>
            <ul class="flex flex-col gap-2">
              <For each={game.players}>
                {(player, index) => {
                  const color = getAvatarColor(index());
                  const isYou = player.id === game.playerId;
                  return (
                    <li
                      class={cn(
                        'flex items-center justify-between border px-4 py-3 transition-colors',
                        player.isReady
                          ? 'border-success/40 bg-success/5'
                          : 'border-border bg-surface',
                        isYou && !player.isReady && 'border-witness/40',
                        player.connectionStatus === 'dropped' && 'opacity-50'
                      )}
                    >
                      <div class="flex items-center gap-3">
                        <div
                          class={cn(
                            'flex size-9 items-center justify-center text-xs font-semibold',
                            color.bg,
                            color.text
                          )}
                        >
                          {player.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div class="flex flex-col gap-0.5">
                          <div class="flex items-center gap-2">
                            <span class="font-medium text-text">{player.name}</span>
                            <Show when={player.isHost}>
                              <span class="border border-witness/30 bg-witness/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-witness">
                                Host
                              </span>
                            </Show>
                            <Show when={isYou && !player.isHost}>
                              <span class="text-xs text-muted">(you)</span>
                            </Show>
                          </div>
                          <span
                            class={cn(
                              'text-xs',
                              player.isReady ? 'text-success' : 'text-muted'
                            )}
                          >
                            {player.isReady ? 'Ready to play' : 'Not ready'}
                          </span>
                        </div>
                      </div>
                      <Show when={player.connectionStatus !== 'connected'}>
                        <ConnectionIndicator status={player.connectionStatus} showLabel />
                      </Show>
                    </li>
                  );
                }}
              </For>
            </ul>
          </Show>

          <Show when={game.synced && totalPlayers() === 0}>
            <div class="flex flex-col items-center gap-3 border border-dashed border-border py-10">
              <svg class="size-8 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p class="text-sm text-muted">Share the code to invite players</p>
            </div>
          </Show>
        </section>

        <footer class="flex flex-col gap-3">
          <Show when={!game.synced}>
            <div class="h-13 w-full animate-pulse bg-muted/20" />
          </Show>

          <Show when={game.synced}>
            <Show when={needMorePlayers()}>
              <p class="text-center text-xs text-muted">
                Need {3 - totalPlayers()} more player{3 - totalPlayers() !== 1 ? 's' : ''} to start
              </p>
            </Show>

            <Show when={currentPlayer()}>
              <button
                type="button"
                onClick={handleToggleReady}
                class={cn(
                  'flex h-13 items-center justify-center text-base font-semibold',
                  currentPlayer()?.isReady ? 'btn-secondary' : 'btn-primary'
                )}
              >
                {currentPlayer()?.isReady ? 'Not Ready' : 'Ready'}
              </button>
            </Show>

            <Show when={game.isHost}>
              <button
                type="button"
                onClick={handleStartGame}
                disabled={!canStartGame()}
                class="btn-witness flex h-13 items-center justify-center text-base font-semibold disabled:cursor-not-allowed disabled:opacity-30"
              >
                Start Game
              </button>
            </Show>

            <div class="flex justify-center pt-2">
              <HowToPlay />
            </div>
          </Show>
        </footer>
      </div>
    </main>
  );
}
