import { For, Show, createMemo } from 'solid-js';
import ConnectionIndicator from '../ConnectionIndicator';
import { cn } from '../../lib/cn';
import { game } from '../../stores/game';
import { continueGame } from '../../lib/game-client';

export default function ResultsPhase() {
  const isWitness = () => game.role === 'witness';

  const sortedPlayers = createMemo(() => {
    return [...game.players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  });

  const handleContinue = () => {
    continueGame();
  };

  return (
    <main class="notebook-margin min-h-dvh bg-background px-5 py-12 md:px-8 md:py-16">
      <div class="mx-auto flex max-w-md flex-col gap-10">
        <header class="flex flex-col items-center gap-4 text-center">
          <div class="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-muted">
            <span>Round {game.round}</span>
            <span class="size-1 bg-border" />
            <span>Results</span>
          </div>
          <h1 class="title-dramatic text-4xl text-text md:text-5xl">
            THE REVEAL
          </h1>
        </header>

        <section class="flex flex-col gap-6">
          <div class="border border-witness/30 bg-witness/5 p-6">
            <div class="flex flex-col items-center gap-2 text-center">
              <span class="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                You were the
              </span>
              <span class="text-2xl font-bold text-text">
                {isWitness() ? 'WITNESS' : 'IMPOSTER'}
              </span>
              <Show when={isWitness()}>
                <p class="text-sm text-muted">
                  You had the real memories
                </p>
              </Show>
              <Show when={!isWitness()}>
                <p class="text-sm text-muted">
                  You were fabricating the whole time
                </p>
              </Show>
            </div>
          </div>

          <Show when={game.fragments.length > 0 && isWitness()}>
            <div class="flex flex-col gap-3">
              <span class="px-1 text-xs font-medium uppercase tracking-[0.2em] text-muted">
                Your Fragments (The Truth)
              </span>
              <ul class="flex flex-col gap-2">
                <For each={game.fragments}>
                  {(fragment) => (
                    <li class="border border-border bg-surface px-4 py-3">
                      <p class="text-sm text-text">{fragment}</p>
                    </li>
                  )}
                </For>
              </ul>
            </div>
          </Show>

          <div class="flex flex-col gap-3">
            <span class="px-1 text-xs font-medium uppercase tracking-[0.2em] text-muted">
              Standings
            </span>
            <ul class="flex flex-col gap-1">
              <For each={sortedPlayers()}>
                {(player, index) => {
                  const isYou = player.id === game.playerId;
                  const position = index() + 1;
                  return (
                    <li
                      class={cn(
                        'flex items-center justify-between border border-border px-4 py-3',
                        player.connectionStatus === 'dropped' && 'opacity-50'
                      )}
                    >
                      <div class="flex items-center gap-3">
                        <span class="flex size-6 items-center justify-center text-xs font-bold text-muted">
                          {position}
                        </span>
                        <div class="flex items-center gap-2">
                          <span class="font-medium text-text">
                            {player.name}
                            <Show when={isYou}>
                              <span class="text-muted"> (you)</span>
                            </Show>
                          </span>
                          <Show when={player.connectionStatus !== 'connected'}>
                            <ConnectionIndicator status={player.connectionStatus} />
                          </Show>
                        </div>
                      </div>
                      <span class="font-bold tabular-nums text-text">
                        {player.score ?? 0}
                      </span>
                    </li>
                  );
                }}
              </For>
            </ul>
          </div>
        </section>

        <footer class="flex flex-col gap-4">
          <Show when={game.isHost}>
            <button
              type="button"
              onClick={handleContinue}
              class="btn-primary flex h-12 items-center justify-center text-sm font-semibold"
            >
              {game.round < game.totalRounds ? 'Next Round' : 'See Final Results'}
            </button>
          </Show>
          <Show when={!game.isHost}>
            <p class="text-center text-sm text-muted">
              Waiting for host to continue...
            </p>
          </Show>
          <p class="text-center text-xs text-muted">
            Round {game.round} of {game.totalRounds}
          </p>
        </footer>
      </div>
    </main>
  );
}
