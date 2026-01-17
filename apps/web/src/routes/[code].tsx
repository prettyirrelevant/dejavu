import { useParams, useNavigate } from '@solidjs/router';
import { Switch, Match, Show, createSignal, onMount, Index } from 'solid-js';
import { game } from '../stores/game';
import { reconnectToRoom } from '../lib/game-client';
import { getSession } from '../lib/storage';
import Lobby from '../components/Lobby';
import JoinForm from '../components/JoinForm';
import MyConnectionStatus from '../components/MyConnectionStatus';
import MemoryPhase from '../components/phases/MemoryPhase';
import RolesPhase from '../components/phases/RolesPhase';
import DetailsPhase from '../components/phases/DetailsPhase';
import QuestionsPhase from '../components/phases/QuestionsPhase';
import VotingPhase from '../components/phases/VotingPhase';
import ResultsPhase from '../components/phases/ResultsPhase';

function LobbySkeleton(props: { roomCode: string }) {
  return (
    <main class="noise-texture notebook-margin min-h-dvh bg-background px-5 py-12 md:px-8 md:py-16">
      <div class="mx-auto flex max-w-sm flex-col gap-10">
        <header class="flex flex-col items-center gap-6 text-center">
          <span class="text-xs font-medium uppercase tracking-[0.3em] text-muted">
            Room Code
          </span>
          <span class="room-code-display text-5xl text-text md:text-6xl">
            {props.roomCode}
          </span>
          <span class="flex items-center gap-2 text-sm text-muted">
            <div class="size-4 animate-pulse bg-muted/20" />
            <span>Connecting...</span>
          </span>
        </header>

        <section class="flex flex-col gap-4">
          <div class="flex items-center justify-between px-1">
            <span class="text-xs font-medium uppercase tracking-[0.2em] text-muted">
              Players
            </span>
            <div class="h-3 w-16 animate-pulse bg-muted/20" />
          </div>

          <ul class="flex flex-col gap-2">
            <Index each={[1, 2, 3]}>
              {() => (
                <li class="flex items-center justify-between border border-border bg-surface px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div class="size-9 animate-pulse bg-muted/20" />
                    <div class="flex flex-col gap-1.5">
                      <div class="h-4 w-24 animate-pulse bg-muted/20" />
                      <div class="h-3 w-16 animate-pulse bg-muted/20" />
                    </div>
                  </div>
                </li>
              )}
            </Index>
          </ul>
        </section>

        <footer class="flex flex-col gap-3">
          <div class="h-13 w-full animate-pulse bg-muted/20" />
        </footer>
      </div>
    </main>
  );
}

export default function Room() {
  const params = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = createSignal(true);
  const [needsJoin, setNeedsJoin] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const roomCode = () => params.code.toUpperCase();

  onMount(async () => {
    const code = roomCode();
    
    if (game.roomCode === code && game.playerId) {
      setIsLoading(false);
      return;
    }

    const session = getSession(code);
    if (session) {
      try {
        const success = await reconnectToRoom(code);
        if (!success) {
          setNeedsJoin(true);
        }
      } catch {
        setError('Failed to reconnect');
      }
    } else {
      setNeedsJoin(true);
    }

    setIsLoading(false);
  });

  return (
    <main class="min-h-dvh bg-background">
      <Show when={isLoading()}>
        <LobbySkeleton roomCode={roomCode()} />
      </Show>

      <Show when={!isLoading() && game.playerId}>
        <MyConnectionStatus />
        <Switch fallback={<Lobby roomCode={params.code.toUpperCase()} />}>
          <Match when={game.phase === 'lobby'}>
            <Lobby roomCode={params.code.toUpperCase()} />
          </Match>
          <Match when={game.phase === 'memory'}>
            <MemoryPhase />
          </Match>
          <Match when={game.phase === 'roles'}>
            <RolesPhase />
          </Match>
          <Match when={game.phase === 'details'}>
            <DetailsPhase />
          </Match>
          <Match when={game.phase === 'questions'}>
            <QuestionsPhase />
          </Match>
          <Match when={game.phase === 'voting'}>
            <VotingPhase />
          </Match>
          <Match when={game.phase === 'results'}>
            <ResultsPhase />
          </Match>
        </Switch>
      </Show>

      <Show when={!isLoading() && !game.playerId && needsJoin()}>
        <div class="noise-texture notebook-margin flex min-h-dvh flex-col bg-background px-5 py-8 md:px-6 md:py-10">
          <div class="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8">
            <div class="flex flex-col items-center gap-4 text-center">
              <span class="text-xs font-medium uppercase tracking-[0.3em] text-muted">
                Joining room
              </span>
              <h1 class="title-dramatic text-4xl text-text md:text-5xl">
                {roomCode()}
              </h1>
            </div>
            <div class="border border-border bg-surface p-7 md:p-9">
              <JoinForm roomCode={roomCode()} />
            </div>
          </div>
        </div>
      </Show>

      <Show when={!isLoading() && !game.playerId && error()}>
        <div class="flex min-h-dvh items-center justify-center px-6">
          <div class="flex flex-col items-center gap-6 text-center">
            <div class="flex h-16 w-16 items-center justify-center border border-border bg-surface">
              <svg class="h-8 w-8 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div class="flex flex-col gap-2">
              <h1 class="text-lg font-medium text-text">{error()}</h1>
              <p class="text-sm text-muted">You may need to join the room again</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              class="btn-primary h-12 px-8 text-sm font-semibold"
            >
              Go Home
            </button>
          </div>
        </div>
      </Show>
    </main>
  );
}
