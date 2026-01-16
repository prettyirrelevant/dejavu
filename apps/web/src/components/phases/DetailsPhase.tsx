import { createSignal, Show, For, createMemo } from 'solid-js';
import Timer from '../Timer';
import { game } from '../../stores/game';
import { submitDetail } from '../../lib/game-client';

export default function DetailsPhase() {
  const [answer, setAnswer] = createSignal('');
  const [hasSubmitted, setHasSubmitted] = createSignal(false);

  const submittedCount = createMemo(() => game.submittedPlayers.length);
  const totalPlayers = createMemo(() => game.players.length);
  const hasAlreadySubmitted = createMemo(() => 
    game.playerId ? game.submittedPlayers.includes(game.playerId) : false
  );

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    if (!answer().trim() || hasSubmitted() || hasAlreadySubmitted()) return;
    
    submitDetail(answer().trim());
    setHasSubmitted(true);
  };

  return (
    <main class="notebook-margin min-h-dvh bg-background px-5 py-12 md:px-8 md:py-16">
      <div class="mx-auto flex max-w-md flex-col gap-10">
        <header class="flex flex-col items-center gap-4 text-center">
          <span class="text-xs font-medium uppercase tracking-[0.3em] text-muted">
            Add Your Detail
          </span>
          <h1 class="title-dramatic text-3xl text-text md:text-4xl">
            THE QUESTION
          </h1>
        </header>

        <section class="flex flex-col gap-6">
          <div class="border border-border bg-surface p-6">
            <Show
              when={game.detailQuestion}
              fallback={
                <p class="text-center text-sm text-muted">Loading question...</p>
              }
            >
              <p class="text-center text-lg font-medium text-text">
                {game.detailQuestion}
              </p>
            </Show>
          </div>

          <Show
            when={!hasSubmitted() && !hasAlreadySubmitted()}
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
                    <p class="text-sm font-medium text-text">Answer Submitted</p>
                    <p class="text-xs text-muted">Waiting for other players...</p>
                  </div>
                </div>

                <div class="flex flex-col gap-3">
                  <div class="flex items-center justify-between px-1">
                    <span class="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                      Submissions
                    </span>
                    <span class="text-xs tabular-nums text-muted">
                      {submittedCount()} / {totalPlayers()}
                    </span>
                  </div>
                  <ul class="flex flex-col gap-1">
                    <For each={game.players}>
                      {(player) => {
                        const submitted = game.submittedPlayers.includes(player.id);
                        return (
                          <li class="flex items-center justify-between border border-border px-3 py-2">
                            <span class="text-sm text-text">{player.name}</span>
                            <Show
                              when={submitted}
                              fallback={
                                <span class="text-xs text-muted">Writing...</span>
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
            <form onSubmit={handleSubmit} class="flex flex-col gap-4">
              <div class="flex flex-col gap-2">
                <label for="answer" class="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                  Your Answer
                </label>
                <textarea
                  id="answer"
                  value={answer()}
                  onInput={(e) => setAnswer(e.currentTarget.value)}
                  placeholder="Describe your memory of this detail..."
                  maxLength={280}
                  rows={4}
                  class="input-field w-full resize-none p-4 text-sm"
                />
                <div class="flex justify-end">
                  <span class="text-xs tabular-nums text-muted">
                    {answer().length}/280
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!answer().trim()}
                class="btn-primary flex h-12 items-center justify-center text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-30"
              >
                Submit Answer
              </button>
            </form>
          </Show>
        </section>

        <footer class="flex flex-col items-center gap-4">
          <Timer />
          <p class="max-w-xs text-center text-xs text-muted">
            {hasSubmitted() || hasAlreadySubmitted()
              ? 'Answers will be revealed when everyone submits or time runs out.'
              : 'Be specific but not suspicious. Witnesses: use your fragments. Imposters: be creative.'
            }
          </p>
        </footer>
      </div>
    </main>
  );
}
