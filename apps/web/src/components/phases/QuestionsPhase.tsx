import { For, Show, createMemo } from 'solid-js';
import Timer from '../Timer';
import ConnectionIndicator from '../ConnectionIndicator';
import { cn } from '../../lib/cn';
import { game } from '../../stores/game';

export default function QuestionsPhase() {
  const playerAnswers = createMemo(() => {
    return game.players.map((player) => ({
      player,
      answer: game.details[player.id] || null,
    }));
  });

  return (
    <main class="notebook-margin min-h-dvh bg-background px-5 py-12 md:px-8 md:py-16">
      <div class="mx-auto flex max-w-md flex-col gap-10">
        <header class="flex flex-col items-center gap-4 text-center">
          <span class="text-xs font-medium uppercase tracking-[0.3em] text-muted">
            Discuss & Deduce
          </span>
          <h1 class="title-dramatic text-3xl text-text md:text-4xl">
            THE ANSWERS
          </h1>
          <p class="text-sm text-muted">
            Question each other. Find the witness.
          </p>
        </header>

        <section class="flex flex-col gap-6">
          <Show when={game.detailQuestion}>
            <div class="border-2 border-text/10 bg-surface p-5">
              <div class="flex flex-col items-center gap-2">
                <span class="text-xs font-medium uppercase tracking-[0.2em] text-muted">The Question</span>
                <p class="text-center text-base font-medium text-text">
                  {game.detailQuestion}
                </p>
              </div>
            </div>
          </Show>

          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-4">
              <span class="h-px flex-1 bg-border" />
              <span class="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                {game.players.length} Responses
              </span>
              <span class="h-px flex-1 bg-border" />
            </div>

            <ul class="flex flex-col gap-3">
              <For each={playerAnswers()}>
                {({ player, answer }, index) => {
                  const isYou = player.id === game.playerId;
                  return (
                    <li
                      class={cn(
                        'border border-border bg-surface',
                        player.connectionStatus === 'dropped' && 'opacity-50',
                        isYou && 'border-text/20'
                      )}
                    >
                      <div class="flex items-center justify-between border-b border-border bg-background/50 px-4 py-2.5">
                        <div class="flex items-center gap-3">
                          <span class="flex size-6 items-center justify-center border border-border text-xs font-medium text-muted">
                            {index() + 1}
                          </span>
                          <span class="font-medium text-text">{player.name}</span>
                          <Show when={isYou}>
                            <span class="text-xs text-muted">(you)</span>
                          </Show>
                          <Show when={player.connectionStatus !== 'connected'}>
                            <ConnectionIndicator status={player.connectionStatus} />
                          </Show>
                        </div>
                        <Show when={player.isHost}>
                          <span class="border border-witness/30 bg-witness/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-witness">
                            Host
                          </span>
                        </Show>
                      </div>
                      <div class="p-5">
                        <Show
                          when={answer}
                          fallback={
                            <p class="text-sm italic text-muted">
                              {player.connectionStatus === 'dropped'
                                ? 'Player disconnected'
                                : 'No answer submitted'}
                            </p>
                          }
                        >
                          <p class="text-base leading-relaxed text-text">{answer}</p>
                        </Show>
                      </div>
                    </li>
                  );
                }}
              </For>
            </ul>
          </div>
        </section>

        <footer class="flex flex-col items-center gap-4">
          <Timer />
          <p class="max-w-xs text-center text-xs text-muted">
            Discuss the answers. Look for inconsistencies. Who seems too certain? Too vague?
          </p>
        </footer>
      </div>
    </main>
  );
}
