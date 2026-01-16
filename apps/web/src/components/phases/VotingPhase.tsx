import Timer from '../Timer';
import { cn } from '../../lib/cn';

export default function VotingPhase() {
  return (
    <div class="noise-texture notebook-margin min-h-dvh bg-background px-4 py-6 md:px-6 md:py-8">
      <div class="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8">
        <header class="flex items-center justify-between">
          <h1 class="text-balance text-xl font-bold tracking-tight text-text">
            Cast Your Vote
          </h1>
          <Timer />
        </header>

        <div class="flex flex-1 items-center justify-center">
          <div
            class={cn(
              'flex flex-col items-center gap-4 border border-border bg-surface p-8',
              'text-center'
            )}
          >
            <span class="text-4xl">🗳️</span>
            <p class="text-lg font-medium text-text">Voting Phase</p>
            <p class="text-sm text-muted">Vote for who you think is the imposter</p>
          </div>
        </div>
      </div>
    </div>
  );
}
