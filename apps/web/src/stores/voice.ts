import { createStore } from 'solid-js/store';
import type { VoiceStatus } from '@dejavu/shared';

interface VoiceStore {
  muted: boolean;
  deafened: boolean;
  speaking: boolean;
  peers: Record<string, VoiceStatus>;
}

const [voice, setVoice] = createStore<VoiceStore>({
  muted: false,
  deafened: false,
  speaking: false,
  peers: {},
});

export { voice, setVoice };
