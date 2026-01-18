import { createSignal, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { PLAYER_NAME_REGEX, PLAYER_NAME_MIN, PLAYER_NAME_MAX } from '@dejavu/shared';
import { cn } from '../lib/cn';
import { user, setUser } from '../stores/user';
import { createAndJoinRoom } from '../lib/game-client';
import { setName } from '../lib/storage';

export default function CreateForm() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = createSignal(user.name);
  const [rounds, setRounds] = createSignal<3 | 5 | 7>(5);
  const [timeScale, setTimeScale] = createSignal<number>(1.0);
  const [allowSpectators, setAllowSpectators] = createSignal<boolean>(true);
  const [voiceEnabled, setVoiceEnabled] = createSignal<boolean>(true);
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [error, setError] = createSignal('');
  const [showAdvanced, setShowAdvanced] = createSignal(false);

  const validatePlayerName = (name: string): string | null => {
    if (name.length < PLAYER_NAME_MIN) return 'Name is required';
    if (name.length > PLAYER_NAME_MAX) return `Name must be ${PLAYER_NAME_MAX} characters or less`;
    if (!PLAYER_NAME_REGEX.test(name)) return 'Only letters, numbers, underscores, and hyphens allowed';
    return null;
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError('');

    const nameError = validatePlayerName(playerName());
    if (nameError) {
      setError(nameError);
      return;
    }

    setIsSubmitting(true);

    try {
      setName(playerName());
      setUser({ name: playerName() });

      const roomCode = await createAndJoinRoom(playerName(), {
        rounds: rounds(),
        timeScale: timeScale(),
        maxPlayers: 8,
        witnessCount: 'auto',
        allowSpectators: allowSpectators(),
        voiceEnabled: voiceEnabled(),
      });

      navigate(`/${roomCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="flex flex-col gap-6">
      <div class="flex flex-col gap-2">
        <label for="create-player-name" class="text-sm font-medium text-text">
          Your name
        </label>
        <input
          id="create-player-name"
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

      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-text">
          Rounds
        </label>
        <div class="grid grid-cols-3 gap-2">
          {([3, 5, 7] as const).map((num) => (
            <button
              type="button"
              onClick={() => setRounds(num)}
              class={cn(
                'h-12 text-sm font-medium transition-all duration-100',
                rounds() === num
                  ? 'border border-text bg-background text-text'
                  : 'border border-border bg-surface text-muted hover:text-text hover:border-muted'
              )}
            >
              {num === 3 ? 'Quick · 3' : num === 5 ? 'Standard · 5' : 'Long · 7'}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced())}
        class="flex items-center gap-2 text-sm text-muted hover:text-text transition-colors"
      >
        <svg 
          class={cn(
            'h-4 w-4 transition-transform duration-200',
            showAdvanced() && 'rotate-90'
          )} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
        More options
      </button>

      <Show when={showAdvanced()}>
        <div class="animate-fade-in flex flex-col gap-6">
          <div class="divider-subtle" />

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-text">
              Game speed
            </label>
            <div class="grid grid-cols-3 gap-2">
              {([
                { value: 0.7, label: 'Relaxed' },
                { value: 1.0, label: 'Normal' },
                { value: 1.3, label: 'Fast' },
              ] as const).map((option) => (
                <button
                  type="button"
                  onClick={() => setTimeScale(option.value)}
                  class={cn(
                    'h-12 text-sm font-medium transition-all duration-100',
                    timeScale() === option.value
                      ? 'border border-text bg-background text-text'
                      : 'border border-border bg-surface text-muted hover:text-text hover:border-muted'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p class="text-xs text-muted">
              How much time you get for each phase
            </p>
          </div>

          <div class="divider-subtle" />

          <div class="flex flex-col gap-4">
            <label class="flex min-h-11 cursor-pointer items-center justify-between">
              <div class="flex flex-col gap-0.5">
                <span class="text-sm font-medium text-text">Spectators can watch</span>
                <span class="text-xs text-muted">Let others join without playing</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={allowSpectators()}
                onClick={() => setAllowSpectators(!allowSpectators())}
                class={cn(
                  'relative h-6 w-10 shrink-0 border transition-colors duration-100',
                  allowSpectators() ? 'bg-witness border-witness' : 'bg-surface-elevated border-border'
                )}
              >
                <span
                  class={cn(
                    'absolute top-0.5 left-0.5 h-4 w-4 bg-background border border-border transition-transform duration-100',
                    allowSpectators() && 'translate-x-4 border-witness/50'
                  )}
                />
              </button>
            </label>

            <label class="flex min-h-11 cursor-pointer items-center justify-between">
              <div class="flex flex-col gap-0.5">
                <span class="text-sm font-medium text-text">Voice chat</span>
                <span class="text-xs text-muted">Talk during discussion phase</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={voiceEnabled()}
                onClick={() => setVoiceEnabled(!voiceEnabled())}
                class={cn(
                  'relative h-6 w-10 shrink-0 border transition-colors duration-100',
                  voiceEnabled() ? 'bg-witness border-witness' : 'bg-surface-elevated border-border'
                )}
              >
                <span
                  class={cn(
                    'absolute top-0.5 left-0.5 h-4 w-4 bg-background border border-border transition-transform duration-100',
                    voiceEnabled() && 'translate-x-4 border-witness/50'
                  )}
                />
              </button>
            </label>
          </div>
        </div>
      </Show>

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
        Start Game
      </button>
    </form>
  );
}
