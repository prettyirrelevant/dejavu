import { createMemo } from 'solid-js';
import { cn } from '../lib/cn';
import { game } from '../stores/game';

interface TimerProps {
  class?: string;
}

export default function Timer(props: TimerProps) {
  const minutes = createMemo(() => Math.floor(game.timeRemaining / 60));
  const seconds = createMemo(() => game.timeRemaining % 60);
  const isLow = createMemo(() => game.timeRemaining <= 10);
  const isCritical = createMemo(() => game.timeRemaining <= 5);

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
    </div>
  );
}
