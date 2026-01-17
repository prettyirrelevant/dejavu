import { createSignal, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { PLAYER_NAME_REGEX, PLAYER_NAME_MIN, PLAYER_NAME_MAX, ROOM_CODE_LENGTH } from '@dejavu/shared';
import { cn } from '../lib/cn';
import { user, setUser } from '../stores/user';
import { joinRoom } from '../lib/game-client';
import { setName, getSession } from '../lib/storage';

interface JoinFormProps {
  roomCode?: string;
}

export default function JoinForm(props: JoinFormProps) {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = createSignal(props.roomCode ?? '');
  const [playerName, setPlayerName] = createSignal(user.name);
  const [joinAsSpectator, setJoinAsSpectator] = createSignal(false);
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [error, setError] = createSignal('');

  const validatePlayerName = (name: string): string | null => {
    if (name.length < PLAYER_NAME_MIN) return 'Name is required';
    if (name.length > PLAYER_NAME_MAX) return `Name must be ${PLAYER_NAME_MAX} characters or less`;
    if (!PLAYER_NAME_REGEX.test(name)) return 'Only letters, numbers, underscores, and hyphens allowed';
    return null;
  };

  const validateRoomCode = (code: string): string | null => {
    if (code.length !== ROOM_CODE_LENGTH) return `Enter the ${ROOM_CODE_LENGTH}-character code`;
    if (!/^[A-Z0-9]+$/.test(code)) return 'Invalid code format';
    return null;
  };

  const handleRoomCodeInput = (value: string) => {
    const sanitized = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, ROOM_CODE_LENGTH);
    setRoomCode(sanitized);
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError('');

    const nameError = validatePlayerName(playerName());
    if (nameError) {
      setError(nameError);
      return;
    }

    if (!props.roomCode) {
      const codeError = validateRoomCode(roomCode());
      if (codeError) {
        setError(codeError);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      setName(playerName());
      setUser({ name: playerName() });

      const existingSession = getSession(roomCode());
      if (existingSession && !props.roomCode) {
        navigate(`/${roomCode()}`);
        return;
      }

      await joinRoom(roomCode(), playerName(), joinAsSpectator());

      if (!props.roomCode) {
        navigate(`/${roomCode()}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="flex flex-col gap-6">
      <Show when={!props.roomCode}>
        <div class="flex flex-col gap-2">
          <label for="room-code" class="text-sm font-medium text-text">
            Game code
          </label>
          <input
            id="room-code"
            type="text"
            value={roomCode()}
            onInput={(e) => handleRoomCodeInput(e.currentTarget.value)}
            placeholder="XXXXXX"
            maxLength={ROOM_CODE_LENGTH}
            autocomplete="off"
            autocapitalize="characters"
            spellcheck={false}
            class={cn(
              'input-field room-code-display h-14 w-full px-4',
              'text-center text-xl text-text placeholder:text-muted/30',
              'uppercase'
            )}
          />
          <p class="text-center text-xs text-muted">
            Ask the host for the code
          </p>
        </div>

        <div class="divider-subtle" />
      </Show>

      <div class="flex flex-col gap-2">
        <label for="join-player-name" class="text-sm font-medium text-text">
          Your name
        </label>
        <input
          id="join-player-name"
          type="text"
          value={playerName()}
          onInput={(e) => setPlayerName(e.currentTarget.value)}
          placeholder="What should we call you?"
          maxLength={PLAYER_NAME_MAX}
          class={cn(
            'input-field h-12 w-full px-4',
            'text-base text-text placeholder:text-muted/50'
          )}
        />
      </div>

      <label class="flex min-h-11 cursor-pointer items-center gap-3">
        <div
          class={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center border transition-colors duration-100',
            joinAsSpectator()
              ? 'border-witness bg-witness'
              : 'border-border bg-background hover:border-muted'
          )}
        >
          <Show when={joinAsSpectator()}>
            <svg class="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </Show>
        </div>
        <input
          type="checkbox"
          checked={joinAsSpectator()}
          onChange={(e) => setJoinAsSpectator(e.currentTarget.checked)}
          class="sr-only"
        />
        <div class="flex flex-col gap-0.5">
          <span class="text-sm font-medium text-text">Just watching</span>
          <span class="text-xs text-muted">Join as a spectator</span>
        </div>
      </label>

      <Show when={error()}>
        <p class="animate-fade-in border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">{error()}</p>
      </Show>

      <button
        type="submit"
        disabled={isSubmitting()}
        class={cn(
          'btn-primary flex h-14 items-center justify-center gap-2',
          'text-base font-semibold',
          'disabled:cursor-not-allowed disabled:opacity-40'
        )}
      >
        <Show when={isSubmitting()}>
          <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </Show>
        Join Game
      </button>
    </form>
  );
}
