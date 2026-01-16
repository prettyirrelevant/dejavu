import { useParams, useNavigate } from '@solidjs/router';
import { Switch, Match, Show, createSignal, onMount } from 'solid-js';
import { game } from '../stores/game';
import { reconnectToRoom } from '../lib/game-client';
import { getSession } from '../lib/storage';
import Lobby from '../components/Lobby';
import JoinForm from '../components/JoinForm';
import MemoryPhase from '../components/phases/MemoryPhase';
import RolesPhase from '../components/phases/RolesPhase';
import DetailsPhase from '../components/phases/DetailsPhase';
import QuestionsPhase from '../components/phases/QuestionsPhase';
import VotingPhase from '../components/phases/VotingPhase';
import ResultsPhase from '../components/phases/ResultsPhase';

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
        <div class="flex min-h-dvh items-center justify-center">
          <div class="flex flex-col items-center gap-4">
            <svg class="h-8 w-8 animate-spin text-witness" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p class="text-sm text-muted">Connecting...</p>
          </div>
        </div>
      </Show>

      <Show when={!isLoading() && game.playerId}>
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
