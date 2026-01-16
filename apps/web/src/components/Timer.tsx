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
        'flex items-center justify-center rounded-lg px-4 py-2',
        'border border-neutral-800 bg-surface',
        isLow() && !isCritical() && 'border-amber-500/50 bg-amber-500/10',
        isCritical() && 'animate-pulse border-red-500/50 bg-red-500/10',
        props.class
      )}
    >
      <span
        class={cn(
          'text-2xl font-bold tabular-nums tracking-wider',
          'text-text',
          isLow() && !isCritical() && 'text-amber-500',
          isCritical() && 'text-red-500'
        )}
      >
        {formattedTime()}
      </span>
    </div>
  );
}
