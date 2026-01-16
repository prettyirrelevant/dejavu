import { Show, For } from 'solid-js';
import Timer from '../Timer';
import { game } from '../../stores/game';

export default function RolesPhase() {
  const isWitness = () => game.role === 'witness';

  return (
    <main class="notebook-margin min-h-dvh bg-background px-5 py-12 md:px-8 md:py-16">
      <div class="mx-auto flex max-w-md flex-col gap-10">
        <header class="flex flex-col items-center gap-4 text-center">
          <span class="text-xs font-medium uppercase tracking-[0.3em] text-muted">
            Your Role
          </span>
          <Show
            when={game.role}
            fallback={
              <div class="flex flex-col items-center gap-3">
                <div class="size-8 animate-pulse border border-border" />
                <p class="text-sm text-muted">Assigning roles...</p>
              </div>
            }
          >
            <h1 class="title-dramatic text-4xl text-text md:text-5xl">
              {isWitness() ? 'WITNESS' : 'IMPOSTER'}
            </h1>
            <p class="text-sm text-muted">
              {isWitness() 
                ? 'You were there. You remember.'
                : "You weren't there. Fabricate. Blend in."
              }
            </p>
          </Show>
        </header>

        <Show when={game.role}>
          <section class="flex flex-col gap-6">
            <Show when={isWitness() && game.fragments.length > 0}>
              <div class="flex flex-col gap-4">
                <div class="flex items-center justify-between px-1">
                  <span class="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                    Your Fragments
                  </span>
                  <span class="text-xs text-muted">
                    {game.fragments.length} memories
                  </span>
                </div>
                <ul class="flex flex-col gap-2">
                  <For each={game.fragments}>
                    {(fragment) => (
                      <li class="border border-witness/30 bg-witness/5 px-4 py-3">
                        <p class="text-sm text-text">{fragment}</p>
                      </li>
                    )}
                  </For>
                </ul>
                <p class="text-center text-xs text-muted">
                  These are your true memories. Use them wisely.
                </p>
              </div>
            </Show>

            <Show when={!isWitness() && game.hints.length > 0}>
              <div class="flex flex-col gap-4">
                <div class="flex items-center justify-between px-1">
                  <span class="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                    Your Hints
                  </span>
                  <span class="text-xs text-muted">
                    {game.hints.length} clues
                  </span>
                </div>
                <ul class="flex flex-col gap-2">
                  <For each={game.hints}>
                    {(hint) => (
                      <li class="border border-border bg-surface px-4 py-3">
                        <p class="text-sm text-text">{hint}</p>
                      </li>
                    )}
                  </For>
                </ul>
                <p class="text-center text-xs text-muted">
                  Vague clues to help you fabricate. Be creative.
                </p>
              </div>
            </Show>

            <Show when={isWitness() && game.fragments.length === 0}>
              <div class="border border-dashed border-border py-8">
                <p class="text-center text-sm text-muted">
                  No fragments received yet...
                </p>
              </div>
            </Show>

            <Show when={!isWitness() && game.hints.length === 0}>
              <div class="border border-dashed border-border py-8">
                <p class="text-center text-sm text-muted">
                  No hints received yet...
                </p>
              </div>
            </Show>
          </section>
        </Show>

        <footer class="flex flex-col items-center gap-4">
          <Timer />
          <p class="max-w-xs text-center text-xs text-muted">
            Memorize your {isWitness() ? 'fragments' : 'hints'}. The questioning begins soon.
          </p>
        </footer>
      </div>
    </main>
  );
}
