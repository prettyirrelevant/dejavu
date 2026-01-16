import { createSignal, Show } from 'solid-js';
import CreateForm from '../components/CreateForm';
import JoinForm from '../components/JoinForm';

type View = 'create' | 'join';

export default function Home() {
  const [view, setView] = createSignal<View>('create');

  return (
    <main class="noise-texture notebook-margin min-h-dvh bg-background px-5 py-12 md:px-8 md:py-20">
      <div class="mx-auto flex max-w-md flex-col gap-12">
        <header class="flex flex-col items-center gap-6 text-center">
          <div class="flex flex-col items-center gap-3">
            <span class="text-xs font-medium uppercase tracking-[0.3em] text-muted">
              A game of memory & deception
            </span>
            <h1 class="title-dramatic text-5xl text-text md:text-6xl">
              DÉJÀ VU
            </h1>
          </div>
          <p class="max-w-xs text-pretty text-base leading-relaxed text-muted">
            One person saw what happened. The rest are making it up.
          </p>
        </header>

        <div class="flex flex-col gap-6">
          <div class="flex border border-border bg-surface p-1">
            <button
              type="button"
              onClick={() => setView('create')}
              class={`flex-1 py-3 text-sm font-medium transition-all duration-150 ${
                view() === 'create'
                  ? 'border border-border bg-background text-text'
                  : 'text-muted hover:text-text'
              }`}
            >
              Create Game
            </button>
            <button
              type="button"
              onClick={() => setView('join')}
              class={`flex-1 py-3 text-sm font-medium transition-all duration-150 ${
                view() === 'join'
                  ? 'border border-border bg-background text-text'
                  : 'text-muted hover:text-text'
              }`}
            >
              Join Game
            </button>
          </div>

          <section class="border border-border bg-surface p-7 md:p-9">
            <Show when={view() === 'create'}>
              <div class="animate-fade-in">
                <CreateForm />
              </div>
            </Show>
            <Show when={view() === 'join'}>
              <div class="animate-fade-in">
                <JoinForm />
              </div>
            </Show>
          </section>
        </div>

        <footer class="flex justify-center">
          <div class="flex items-center gap-4 text-xs text-muted">
            <span>3–8 players</span>
            <span class="h-px w-4 bg-border" />
            <span>~3 min per round</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
