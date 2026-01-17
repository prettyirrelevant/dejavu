import { Show, createMemo } from 'solid-js';
import { connection } from '../stores/connection';
import { cn } from '../lib/cn';

const STATUS_CONFIG = {
  idle: { color: 'text-muted', label: 'Idle' },
  connecting: { color: 'text-amber-500', label: 'Connecting' },
  connected: { color: 'text-success', label: 'Connected' },
  disconnected: { color: 'text-imposter', label: 'Disconnected' },
  error: { color: 'text-imposter', label: 'Error' },
} as const;

function formatLatency(ms: number): string {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function WifiIcon(props: { class?: string; animate?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={cn('size-4', props.animate && 'animate-pulse', props.class)}
    >
      <path d="M12 20h.01" />
      <path d="M8.5 16.429a5 5 0 0 1 7 0" />
      <path d="M5 12.859a10 10 0 0 1 14 0" />
      <path d="M1.5 9.288a15 15 0 0 1 21 0" />
    </svg>
  );
}

export default function MyConnectionStatus() {
  const config = createMemo(() => STATUS_CONFIG[connection.status]);
  const isConnected = createMemo(() => connection.status === 'connected');
  const isDisconnected = createMemo(() => 
    connection.status === 'disconnected' || connection.status === 'error'
  );

  return (
    <div
      class={cn(
        'fixed bottom-4 right-4 z-50 flex items-center gap-2 border px-3 py-2 text-xs',
        isDisconnected()
          ? 'border-imposter/30 bg-imposter/5'
          : 'border-border bg-surface'
      )}
    >
      <WifiIcon 
        class={config().color} 
        animate={connection.status === 'connecting'} 
      />
      
      <Show
        when={isConnected()}
        fallback={
          <span class={cn('font-medium', isDisconnected() && 'text-imposter')}>
            {config().label}
          </span>
        }
      >
        <span class="tabular-nums text-muted">
          {formatLatency(connection.latency)}
        </span>
      </Show>
    </div>
  );
}
