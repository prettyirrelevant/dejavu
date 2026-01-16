import { For, Show, createMemo } from 'solid-js';
import Timer from '../Timer';
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

        <section class="flex flex-col gap-4">
          <Show when={game.detailQuestion}>
            <div class="border border-border bg-surface p-4">
              <p class="text-center text-sm text-muted">
                <span class="font-medium text-text">Q:</span> {game.detailQuestion}
              </p>
            </div>
          </Show>

          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between px-1">
              <span class="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                Responses
              </span>
              <span class="text-xs text-muted">
                {game.players.length} players
              </span>
            </div>

            <ul class="flex flex-col gap-2">
              <For each={playerAnswers()}>
                {({ player, answer }) => {
                  const isYou = player.id === game.playerId;
                  return (
                    <li class="border border-border bg-surface">
                      <div class="flex items-center justify-between border-b border-border px-4 py-2">
                        <div class="flex items-center gap-2">
                          <span class="font-medium text-text">{player.name}</span>
                          <Show when={isYou}>
                            <span class="text-xs text-muted">(you)</span>
                          </Show>
                        </div>
                        <Show when={player.isHost}>
                          <span class="border border-witness/30 bg-witness/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-witness">
                            Host
                          </span>
                        </Show>
                      </div>
                      <div class="p-4">
                        <Show
                          when={answer}
                          fallback={
                            <p class="text-sm italic text-muted">No answer submitted</p>
                          }
                        >
                          <p class="text-sm text-text">{answer}</p>
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
