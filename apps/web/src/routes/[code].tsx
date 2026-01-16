import { useParams, useNavigate } from '@solidjs/router';
import { Switch, Match, Show, createSignal, onMount } from 'solid-js';
import { game } from '../stores/game';
import { reconnectToRoom } from '../lib/game-client';
import { getSession } from '../lib/storage';
import Lobby from '../components/Lobby';
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
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    const roomCode = params.code.toUpperCase();
    
    if (game.roomCode === roomCode && game.playerId) {
      setIsLoading(false);
      return;
    }

    const session = getSession(roomCode);
    if (session) {
      try {
        const success = await reconnectToRoom(roomCode);
        if (!success) {
          setError('Session expired');
        }
      } catch {
        setError('Failed to reconnect');
      }
    } else {
      setError('No active session for this room');
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

      <Show when={!isLoading() && error()}>
        <div class="flex min-h-dvh items-center justify-center px-6">
          <div class="flex flex-col items-center gap-6 text-center">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated">
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
              class="btn-primary h-12 rounded-xl px-8 text-sm font-semibold"
            >
              Go Home
            </button>
          </div>
        </div>
      </Show>

      <Show when={!isLoading() && !error() && game.playerId}>
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
    </main>
  );
}
