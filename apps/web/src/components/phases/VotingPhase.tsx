import { createSignal, For, Show, createMemo } from 'solid-js';
import Timer from '../Timer';
import ConnectionIndicator from '../ConnectionIndicator';
import { cn } from '../../lib/cn';
import { game } from '../../stores/game';
import { castVote } from '../../lib/game-client';

export default function VotingPhase() {
  const [selectedPlayer, setSelectedPlayer] = createSignal<string | null>(null);
  const [hasVoted, setHasVoted] = createSignal(false);

  const votedCount = createMemo(() => game.votedPlayers.length);
  const totalPlayers = createMemo(() => game.players.length);
  const hasAlreadyVoted = createMemo(() =>
    game.playerId ? game.votedPlayers.includes(game.playerId) : false
  );

  const otherPlayers = createMemo(() =>
    game.players.filter((p) => p.id !== game.playerId)
  );

  const handleVote = () => {
    const target = selectedPlayer();
    if (!target || hasVoted() || hasAlreadyVoted()) return;

    castVote(target);
    setHasVoted(true);
  };

  return (
    <main class="notebook-margin min-h-dvh bg-background px-5 py-12 md:px-8 md:py-16">
      <div class="mx-auto flex max-w-md flex-col gap-10">
        <header class="flex flex-col items-center gap-4 text-center">
          <span class="text-xs font-medium uppercase tracking-[0.3em] text-muted">
            Cast Your Vote
          </span>
          <h1 class="title-dramatic text-3xl text-text md:text-4xl">
            WHO IS THE WITNESS?
          </h1>
        </header>

        <section class="flex flex-col gap-6">
          <Show
            when={!hasVoted() && !hasAlreadyVoted()}
            fallback={
              <div class="flex flex-col gap-6">
                <div class="border border-success/30 bg-success/5 p-6">
                  <div class="flex flex-col items-center gap-2">
                    <svg
                      class="size-6 text-success"
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
                    <p class="text-sm font-medium text-text">Vote Cast</p>
                    <p class="text-xs text-muted">Waiting for other players...</p>
                  </div>
                </div>

                <div class="flex flex-col gap-3">
                  <div class="flex items-center justify-between px-1">
                    <span class="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                      Votes In
                    </span>
                    <span class="text-xs tabular-nums text-muted">
                      {votedCount()} / {totalPlayers()}
                    </span>
                  </div>
                  <ul class="flex flex-col gap-1">
                    <For each={game.players}>
                      {(player) => {
                        const voted = game.votedPlayers.includes(player.id);
                        const isYou = player.id === game.playerId;
                        return (
                          <li
                            class={cn(
                              'flex items-center justify-between border border-border px-3 py-2',
                              player.connectionStatus === 'dropped' && 'opacity-50'
                            )}
                          >
                            <div class="flex items-center gap-2">
                              <span class="text-sm text-text">
                                {player.name}
                                <Show when={isYou}>
                                  <span class="text-muted"> (you)</span>
                                </Show>
                              </span>
                              <Show when={player.connectionStatus !== 'connected'}>
                                <ConnectionIndicator status={player.connectionStatus} />
                              </Show>
                            </div>
                            <Show
                              when={voted}
                              fallback={
                                <span class="text-xs text-muted">
                                  {player.connectionStatus === 'dropped' ? 'Disconnected' : 'Deciding...'}
                                </span>
                              }
                            >
                              <svg
                                class="size-4 text-success"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                aria-hidden="true"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </Show>
                          </li>
                        );
                      }}
                    </For>
                  </ul>
                </div>
              </div>
            }
          >
            <div class="flex flex-col gap-4">
              <p class="text-center text-sm text-muted">
                Select the player you believe is the witness
              </p>

              <ul class="flex flex-col gap-2">
                <For each={otherPlayers()}>
                  {(player) => {
                    const isSelected = () => selectedPlayer() === player.id;
                    return (
                      <li>
                        <button
                          type="button"
                          onClick={() => setSelectedPlayer(player.id)}
                          disabled={player.connectionStatus === 'dropped'}
                          class={cn(
                            'flex w-full items-center justify-between border-2 px-4 py-4 text-left transition-all',
                            isSelected()
                              ? 'border-witness bg-witness/10 ring-2 ring-witness/30'
                              : 'border-border bg-surface hover:border-muted',
                            player.connectionStatus === 'dropped' && 'cursor-not-allowed opacity-50'
                          )}
                        >
                          <div class="flex items-center gap-3">
                            <div class={cn(
                              'flex size-6 items-center justify-center rounded-full border-2 transition-colors',
                              isSelected()
                                ? 'border-witness bg-witness'
                                : 'border-muted bg-transparent'
                            )}>
                              <Show when={isSelected()}>
                                <svg class="size-3 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </Show>
                            </div>
                            <span class={cn(
                              'font-medium',
                              isSelected() ? 'text-witness' : 'text-text'
                            )}>{player.name}</span>
                            <Show when={player.connectionStatus !== 'connected'}>
                              <ConnectionIndicator status={player.connectionStatus} />
                            </Show>
                          </div>
                          <Show when={isSelected()}>
                            <span class="text-xs font-semibold uppercase tracking-wider text-witness">
                              Selected
                            </span>
                          </Show>
                        </button>
                      </li>
                    );
                  }}
                </For>
              </ul>

              <button
                type="button"
                onClick={handleVote}
                disabled={!selectedPlayer()}
                class="btn-witness flex h-12 items-center justify-center text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-30"
              >
                Confirm Vote
              </button>
            </div>
          </Show>
        </section>

        <footer class="flex flex-col items-center gap-4">
          <Timer />
          <p class="max-w-xs text-center text-xs text-muted">
            {hasVoted() || hasAlreadyVoted()
              ? 'Results will be revealed when everyone votes or time runs out.'
              : 'Vote for who you think had the real memories. You cannot vote for yourself.'
            }
          </p>
        </footer>
      </div>
    </main>
  );
}
