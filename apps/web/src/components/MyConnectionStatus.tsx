import { Show, createMemo, createSignal, onCleanup } from 'solid-js';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { connection } from '../stores/connection';
import { cn } from '../lib/cn';

dayjs.extend(relativeTime);

const STATUS_CONFIG = {
  idle: { color: 'bg-muted', label: 'Idle' },
  connecting: { color: 'bg-amber-500 animate-pulse', label: 'Connecting' },
  connected: { color: 'bg-success', label: 'Connected' },
  disconnected: { color: 'bg-imposter', label: 'Disconnected' },
  error: { color: 'bg-imposter', label: 'Error' },
} as const;

function formatLatency(ms: number): string {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTimeAgo(timestamp: number): string {
  if (timestamp === 0) return 'never';
  return dayjs(timestamp).fromNow();
}

export default function MyConnectionStatus() {
  const [now, setNow] = createSignal(Date.now());
  const interval = setInterval(() => setNow(Date.now()), 1000);
  onCleanup(() => clearInterval(interval));

  const config = createMemo(() => STATUS_CONFIG[connection.status]);
  const isConnected = createMemo(() => connection.status === 'connected');
  const isDisconnected = createMemo(() => 
    connection.status === 'disconnected' || connection.status === 'error'
  );

  const displayTimeAgo = createMemo(() => {
    now(); // subscribes to now() for re-computation
    return formatTimeAgo(connection.lastPong);
  });

  return (
    <div
      class={cn(
        'fixed bottom-4 right-4 z-50 flex items-center gap-2 border px-3 py-2 text-xs',
        isDisconnected()
          ? 'border-imposter/30 bg-imposter/5'
          : 'border-border bg-surface'
      )}
    >
      <span class={cn('size-2 rounded-full', config().color)} />
      
      <Show
        when={isConnected()}
        fallback={
          <span class={cn('font-medium', isDisconnected() && 'text-imposter')}>
            {config().label}
          </span>
        }
      >
        <div class="flex items-center gap-2">
          <span class="tabular-nums text-muted">
            {formatLatency(connection.latency)}
          </span>
          <span class="text-border">•</span>
          <span class="text-muted">{displayTimeAgo()}</span>
        </div>
      </Show>
    </div>
  );
}
