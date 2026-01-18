import { createSignal, createMemo, createEffect, onCleanup, Show } from 'solid-js';
import { cn } from '../lib/cn';
import { game } from '../stores/game';

interface TimerProps {
  class?: string;
}

export default function Timer(props: TimerProps) {
  const [localTime, setLocalTime] = createSignal(0);
  const [hasReceivedTime, setHasReceivedTime] = createSignal(false);

  createEffect(() => {
    const serverTime = Math.floor(game.timeRemaining / 1000);
    setLocalTime(serverTime);
    
    if (game.timeRemaining > 0) {
      setHasReceivedTime(true);
    }

    const interval = setInterval(() => {
      setLocalTime((prev) => Math.max(0, prev - 1));
    }, 1000);

    onCleanup(() => clearInterval(interval));
  });

  const minutes = createMemo(() => Math.floor(localTime() / 60));
  const seconds = createMemo(() => localTime() % 60);
  const isLow = createMemo(() => localTime() <= 10);
  const isCritical = createMemo(() => localTime() <= 5);

  const formattedTime = createMemo(() => {
    const m = minutes().toString().padStart(2, '0');
    const s = seconds().toString().padStart(2, '0');
    return `${m}:${s}`;
  });

  return (
    <div
      class={cn(
        'flex items-center justify-center px-4 py-2',
        'border border-border bg-surface',
        isLow() && !isCritical() && 'border-amber-600/50 bg-amber-50',
        isCritical() && 'animate-pulse border-red-600/50 bg-red-50',
        props.class
      )}
    >
      <Show
        when={hasReceivedTime()}
        fallback={
          <div class="h-8 w-16 animate-pulse bg-muted/20" />
        }
      >
        <span
          class={cn(
            'text-2xl font-bold tabular-nums tracking-wider',
            'text-text',
            isLow() && !isCritical() && 'text-amber-600',
            isCritical() && 'text-red-600'
          )}
        >
          {formattedTime()}
        </span>
      </Show>
    </div>
  );
}
