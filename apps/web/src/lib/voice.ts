import 'webrtc-adapter';
import { PartyTracks, getMic, createAudioSink } from 'partytracks/client';
import { createSignal, onCleanup, createEffect } from 'solid-js';
import type { Subscription } from 'rxjs';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

interface VoiceState {
  isConnected: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  error: string | null;
  permissionState: string | null;
}

interface RemoteParticipant {
  odId: string;
  name: string;
  isSpeaking: boolean;
}

let partyTracks: PartyTracks | null = null;
let mic: ReturnType<typeof getMic> | null = null;
let subscriptions: Subscription[] = [];

export function createVoiceChat(roomCode: string, playerId: string, playerName: string) {
  const [state, setState] = createSignal<VoiceState>({
    isConnected: false,
    isMuted: true,
    isSpeaking: false,
    error: null,
    permissionState: null,
  });

  const [remoteParticipants, setRemoteParticipants] = createSignal<RemoteParticipant[]>([]);

  const connect = async () => {
    try {
      partyTracks = new PartyTracks({
        prefix: `${API_URL}/partytracks`,
      });

      mic = getMic();

      const permSub = mic.permissionState$.subscribe((ps) => {
        setState((prev) => ({ ...prev, permissionState: ps }));
      });
      subscriptions.push(permSub);

      const errorSub = mic.error$.subscribe((err) => {
        console.error('Mic error:', err);
        setState((prev) => ({ ...prev, error: err.message }));
      });
      subscriptions.push(errorSub);

      const broadcastingSub = mic.isBroadcasting$.subscribe((isBroadcasting) => {
        setState((prev) => ({ ...prev, isMuted: !isBroadcasting }));
      });
      subscriptions.push(broadcastingSub);

      const trackMetadata$ = partyTracks.push(mic.broadcastTrack$);

      const metadataSub = trackMetadata$.subscribe((metadata) => {
        console.log('Track metadata:', metadata);
      });
      subscriptions.push(metadataSub);

      setState((prev) => ({ ...prev, isConnected: true, error: null }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      setState((prev) => ({ ...prev, error: message }));
    }
  };

  const disconnect = () => {
    subscriptions.forEach((sub) => sub.unsubscribe());
    subscriptions = [];

    if (mic) {
      mic.stopBroadcasting();
      mic.disableSource();
      mic = null;
    }

    partyTracks = null;
    setState({
      isConnected: false,
      isMuted: true,
      isSpeaking: false,
      error: null,
      permissionState: null,
    });
  };

  const toggleMute = () => {
    if (!mic) return;
    mic.toggleBroadcasting();
  };

  const unmute = () => {
    if (!mic) return;
    mic.startBroadcasting();
  };

  const mute = () => {
    if (!mic) return;
    mic.stopBroadcasting();
  };

  onCleanup(() => {
    disconnect();
  });

  return {
    state,
    remoteParticipants,
    connect,
    disconnect,
    toggleMute,
    mute,
    unmute,
  };
}
