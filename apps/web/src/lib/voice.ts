import Daily, { DailyCall, DailyParticipant, DailyEventObjectActiveSpeakerChange } from '@daily-co/daily-js';
import { createSignal, onCleanup } from 'solid-js';
import { game } from '../stores/game';

export interface VoiceParticipant {
  odId: string
  odName: string
  isSpeaking: boolean
  isMuted: boolean
}

interface VoiceState {
  isConnected: boolean
  isConnecting: boolean
  isMuted: boolean
  error: string | null
  participants: VoiceParticipant[]
  activeSpeakerId: string | null
}

export function createVoiceChat(roomCode: string, playerId: string, playerName: string) {
  let callObject: DailyCall | null = null;

  const [state, setState] = createSignal<VoiceState>({
    isConnected: false,
    isConnecting: false,
    isMuted: false,
    error: null,
    participants: [],
    activeSpeakerId: null,
  });

  const updateParticipants = () => {
    if (!callObject) return;
    
    const participants = callObject.participants();
    const mapped: VoiceParticipant[] = Object.values(participants).map((p: DailyParticipant) => ({
      odId: p.user_id || p.session_id,
      odName: p.user_name || 'Unknown',
      isSpeaking: state().activeSpeakerId === p.session_id,
      isMuted: p.audio === false,
    }));

    setState((prev) => ({ ...prev, participants: mapped }));
  };

  const connect = async () => {
    try {
      setState((prev) => ({ ...prev, isConnecting: true, error: null }));

      const url = game.voiceRoomUrl;
      if (!url) {
        throw new Error('Voice chat not available');
      }

      callObject = Daily.createCallObject({
        audioSource: true,
        videoSource: false,
      });

      callObject.on('joined-meeting', () => {
        setState((prev) => ({ ...prev, isConnected: true, isConnecting: false }));
        updateParticipants();
      });

      callObject.on('left-meeting', () => {
        setState((prev) => ({ 
          ...prev, 
          isConnected: false, 
          participants: [],
          activeSpeakerId: null,
        }));
      });

      callObject.on('participant-joined', () => {
        updateParticipants();
      });

      callObject.on('participant-left', () => {
        updateParticipants();
      });

      callObject.on('participant-updated', () => {
        updateParticipants();
      });

      callObject.on('active-speaker-change', (event: DailyEventObjectActiveSpeakerChange | undefined) => {
        if (event?.activeSpeaker) {
          setState((prev) => ({ ...prev, activeSpeakerId: event.activeSpeaker.peerId }));
          updateParticipants();
        }
      });

      callObject.on('error', (event) => {
        setState((prev) => ({ 
          ...prev, 
          error: event?.errorMsg || 'Voice chat error',
          isConnecting: false,
        }));
      });

      await callObject.join({ 
        url,
        userName: playerName,
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      setState((prev) => ({ ...prev, error: message, isConnecting: false }));
    }
  };

  const disconnect = async () => {
    if (callObject) {
      await callObject.leave();
      callObject.destroy();
      callObject = null;
    }
    setState({
      isConnected: false,
      isConnecting: false,
      isMuted: false,
      error: null,
      participants: [],
      activeSpeakerId: null,
    });
  };

  const toggleMute = () => {
    if (!callObject) return;
    const currentMuted = state().isMuted;
    callObject.setLocalAudio(currentMuted);
    setState((prev) => ({ ...prev, isMuted: !currentMuted }));
  };

  const mute = () => {
    if (!callObject) return;
    callObject.setLocalAudio(false);
    setState((prev) => ({ ...prev, isMuted: true }));
  };

  const unmute = () => {
    if (!callObject) return;
    callObject.setLocalAudio(true);
    setState((prev) => ({ ...prev, isMuted: false }));
  };

  onCleanup(() => {
    disconnect();
  });

  return {
    state,
    connect,
    disconnect,
    toggleMute,
    mute,
    unmute,
  };
}
