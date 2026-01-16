import { createStore } from 'solid-js/store';

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

interface ConnectionStore {
  status: ConnectionStatus;
  latency: number;
  lastPong: number;
}

const [connection, setConnection] = createStore<ConnectionStore>({
  status: 'idle',
  latency: 0,
  lastPong: 0,
});

export { connection, setConnection };
