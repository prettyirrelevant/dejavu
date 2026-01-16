import { Show } from 'solid-js';
import Timer from '../Timer';
import { game } from '../../stores/game';

export default function MemoryPhase() {
  return (
    <main class="notebook-margin min-h-dvh bg-background px-5 py-12 md:px-8 md:py-16">
      <div class="mx-auto flex max-w-md flex-col gap-10">
        <header class="flex flex-col items-center gap-4 text-center">
          <div class="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-muted">
            <span>Round {game.round}</span>
            <span class="size-1 bg-border" />
            <span>of {game.totalRounds}</span>
          </div>
          <h1 class="title-dramatic text-4xl text-text md:text-5xl">
            THE MEMORY
          </h1>
        </header>

        <section class="flex flex-col gap-6">
          <div class="border border-border bg-surface p-6 md:p-8">
            <Show
              when={game.memoryPrompt}
              fallback={
                <div class="flex flex-col items-center gap-3 py-8">
                  <div class="size-6 animate-pulse border border-border" />
                  <p class="text-sm text-muted">Loading memory...</p>
                </div>
              }
            >
              <p class="text-pretty text-center text-lg leading-relaxed text-text md:text-xl">
                {game.memoryPrompt}
              </p>
            </Show>
          </div>

          <div class="flex flex-col items-center gap-2">
            <p class="text-xs font-medium uppercase tracking-[0.2em] text-muted">
              Memorize this scenario
            </p>
            <Timer />
          </div>
        </section>

        <footer class="flex justify-center">
          <p class="max-w-xs text-center text-sm text-muted">
            Everyone sees the same memory. Soon you'll discover your role.
          </p>
        </footer>
      </div>
    </main>
  );
}
