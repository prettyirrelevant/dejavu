import { useParams } from '@solidjs/router';
import { Switch, Match } from 'solid-js';
import { game } from '../stores/game';
import Lobby from '../components/Lobby';
import MemoryPhase from '../components/phases/MemoryPhase';
import RolesPhase from '../components/phases/RolesPhase';
import DetailsPhase from '../components/phases/DetailsPhase';
import QuestionsPhase from '../components/phases/QuestionsPhase';
import VotingPhase from '../components/phases/VotingPhase';
import ResultsPhase from '../components/phases/ResultsPhase';

export default function Room() {
  const params = useParams<{ code: string }>();

  return (
    <main class="min-h-dvh bg-background">
      <Switch fallback={<Lobby roomCode={params.code} />}>
        <Match when={game.phase === 'lobby'}>
          <Lobby roomCode={params.code} />
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
    </main>
  );
}
