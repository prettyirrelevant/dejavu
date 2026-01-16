import { Show } from 'solid-js';
import type { ConnectionStatus } from '@dejavu/shared';
import { cn } from '../lib/cn';

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<
  ConnectionStatus,
  { color: string; label: string; pulse?: boolean }
> = {
  connected: { color: 'bg-success', label: 'Connected' },
  stale: { color: 'bg-amber-500', label: 'Slow connection' },
  degraded: { color: 'bg-orange-500', label: 'Poor connection' },
  dropped: { color: 'bg-imposter', label: 'Disconnected' },
  reconnecting: { color: 'bg-amber-500', label: 'Reconnecting...', pulse: true },
};

export default function ConnectionIndicator(props: ConnectionIndicatorProps) {
  const config = () => STATUS_CONFIG[props.status];
  const size = () => (props.size === 'md' ? 'size-2.5' : 'size-1.5');

  return (
    <div class="flex items-center gap-1.5">
      <span
        class={cn(
          size(),
          'rounded-full',
          config().color,
          config().pulse && 'animate-pulse'
        )}
        title={config().label}
      />
      <Show when={props.showLabel}>
        <span
          class={cn(
            'text-xs text-muted',
            props.status === 'dropped' && 'text-imposter'
          )}
        >
          {config().label}
        </span>
      </Show>
    </div>
  );
}
