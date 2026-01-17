import { Show } from 'solid-js';
import Timer from '../Timer';
import { game } from '../../stores/game';

export default function MemoryPhase() {
  return (
    <main class="notebook-margin min-h-dvh bg-background px-5 py-12 md:px-8 md:py-16">
      <div class="mx-auto flex max-w-md flex-col gap-12">
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

        <section class="flex flex-col gap-8">
          <div class="relative">
            <div class="pointer-events-none absolute -left-2 -top-2 size-6 border-l-2 border-t-2 border-text/20" />
            <div class="pointer-events-none absolute -right-2 -top-2 size-6 border-r-2 border-t-2 border-text/20" />
            <div class="pointer-events-none absolute -bottom-2 -left-2 size-6 border-b-2 border-l-2 border-text/20" />
            <div class="pointer-events-none absolute -bottom-2 -right-2 size-6 border-b-2 border-r-2 border-text/20" />
            
            <div class="border-2 border-text/10 bg-surface p-8 md:p-10">
              <Show
                when={game.memoryPrompt}
                fallback={
                  <div class="flex flex-col items-center gap-4 py-6">
                    <div class="h-6 w-4/5 animate-pulse bg-muted/15" />
                    <div class="h-6 w-3/5 animate-pulse bg-muted/15" />
                    <div class="h-6 w-4/5 animate-pulse bg-muted/15" />
                  </div>
                }
              >
                <div class="flex flex-col gap-6">
                  <span class="select-none font-serif text-5xl leading-none text-text/15">"</span>
                  
                  <p class="text-pretty px-2 text-center font-serif text-xl leading-relaxed tracking-wide text-text md:text-2xl">
                    {game.memoryPrompt}
                  </p>
                  
                  <span class="select-none self-end font-serif text-5xl leading-none text-text/15">"</span>
                </div>
              </Show>
            </div>
          </div>

          <div class="flex flex-col items-center gap-3">
            <div class="flex items-center gap-4">
              <span class="h-px w-8 bg-border" />
              <p class="text-xs font-medium uppercase tracking-[0.25em] text-muted">
                Commit to Memory
              </p>
              <span class="h-px w-8 bg-border" />
            </div>
            <Timer />
          </div>
        </section>

        <footer class="flex flex-col items-center gap-3">
          <div class="h-px w-16 bg-border-subtle" />
          <p class="max-w-xs text-center text-sm leading-relaxed text-muted">
            Everyone sees the same memory. Soon you'll discover your role.
          </p>
        </footer>
      </div>
    </main>
  );
}
