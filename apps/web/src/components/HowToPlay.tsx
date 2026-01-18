import { createSignal, Show, createEffect } from 'solid-js';

interface HowToPlayProps {
  open?: boolean;
  onClose?: () => void;
  showTrigger?: boolean;
}

export default function HowToPlay(props: HowToPlayProps) {
  const [isOpen, setIsOpen] = createSignal(props.open ?? false);

  createEffect(() => {
    if (props.open !== undefined) {
      setIsOpen(props.open);
    }
  });

  const handleClose = () => {
    setIsOpen(false);
    props.onClose?.();
  };

  return (
    <>
      <Show when={props.showTrigger !== false}>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          class="text-sm text-muted underline underline-offset-2 hover:text-text"
        >
          How to Play
        </button>
      </Show>

      <Show when={isOpen()}>
        <div
          class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm md:items-center md:p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div class="max-h-[90vh] w-full overflow-y-auto bg-background md:max-h-[85vh] md:max-w-md md:border md:border-border">
            <div class="sticky top-0 flex items-center justify-between border-b border-border bg-background px-5 py-4 md:px-6">
              <h2 class="text-lg font-semibold text-text tracking-tight">How to Play</h2>
              <button
                type="button"
                onClick={handleClose}
                class="size-8 flex items-center justify-center text-muted hover:text-text transition-colors"
              >
                <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="flex flex-col divide-y divide-border">
              <section class="px-5 py-4 md:px-6 md:py-5">
                <p class="text-sm text-muted leading-relaxed">
                  Something strange happened. One or two of you actually saw it.
                  The rest are making it up. Find the <span class="text-witness">Witness</span> before 
                  the <span class="text-imposter">Imposters</span> fool everyone.
                </p>
              </section>

              <section class="px-5 py-4 md:px-6 md:py-5">
                <h3 class="text-xs font-medium uppercase tracking-widest text-muted/60 mb-4">Roles</h3>
                <div class="space-y-4">
                  <div>
                    <p class="text-sm text-text font-medium">Witness</p>
                    <p class="text-sm text-muted mt-1 leading-relaxed">
                      You get the real details: exact colors, numbers, quotes. Answer accurately, but not too perfectly.
                    </p>
                  </div>
                  <div>
                    <p class="text-sm text-text font-medium">Imposter</p>
                    <p class="text-sm text-muted mt-1 leading-relaxed">
                      You only get vague hints. Make up convincing details. Watch for anyone who knows too much.
                    </p>
                  </div>
                </div>
              </section>

              <section class="px-5 py-4 md:px-6 md:py-5">
                <h3 class="text-xs font-medium uppercase tracking-widest text-muted/60 mb-4">Flow</h3>
                <div class="space-y-4">
                  <div class="flex gap-4">
                    <span class="text-sm text-muted/40 tabular-nums w-4 shrink-0">01</span>
                    <div>
                      <p class="text-sm text-text font-medium">Memory</p>
                      <p class="text-sm text-muted mt-0.5">Everyone reads the same scenario.</p>
                    </div>
                  </div>
                  <div class="flex gap-4">
                    <span class="text-sm text-muted/40 tabular-nums w-4 shrink-0">02</span>
                    <div>
                      <p class="text-sm text-text font-medium">Roles</p>
                      <p class="text-sm text-muted mt-0.5">Witnesses see specifics. Imposters see hints.</p>
                    </div>
                  </div>
                  <div class="flex gap-4">
                    <span class="text-sm text-muted/40 tabular-nums w-4 shrink-0">03</span>
                    <div>
                      <p class="text-sm text-text font-medium">Answer</p>
                      <p class="text-sm text-muted mt-0.5">Everyone privately answers a question about the memory.</p>
                    </div>
                  </div>
                  <div class="flex gap-4">
                    <span class="text-sm text-muted/40 tabular-nums w-4 shrink-0">04</span>
                    <div>
                      <p class="text-sm text-text font-medium">Discuss</p>
                      <p class="text-sm text-muted mt-0.5">All answers revealed. Talk. Interrogate. Get suspicious.</p>
                    </div>
                  </div>
                  <div class="flex gap-4">
                    <span class="text-sm text-muted/40 tabular-nums w-4 shrink-0">05</span>
                    <div>
                      <p class="text-sm text-text font-medium">Vote</p>
                      <p class="text-sm text-muted mt-0.5">Pick who you think is a Witness. No voting for yourself.</p>
                    </div>
                  </div>
                </div>
              </section>

              <section class="px-5 py-4 md:px-6 md:py-5">
                <h3 class="text-xs font-medium uppercase tracking-widest text-muted/60 mb-4">Points</h3>
                <div class="space-y-2">
                  <div class="flex items-baseline justify-between">
                    <span class="text-sm text-muted">Correctly identify a Witness</span>
                    <span class="text-sm font-semibold text-success">+10</span>
                  </div>
                  <div class="flex items-baseline justify-between">
                    <span class="text-sm text-muted">Witness fools a voter</span>
                    <span class="text-sm font-semibold text-witness">+5</span>
                  </div>
                </div>
                <p class="text-xs text-muted/50 mt-3">Most points after all rounds wins.</p>
              </section>

              <section class="px-5 py-4 pb-8 bg-surface/50 md:px-6 md:py-5 md:pb-5">
                <h3 class="text-xs font-medium uppercase tracking-widest text-muted/60 mb-3">Quick tips</h3>
                <ul class="space-y-2 text-sm text-muted">
                  <li><span class="text-witness">Witnesses</span> · Don't be perfect. Small mistakes make you look human.</li>
                  <li><span class="text-imposter">Imposters</span> · Commit fully. Hesitation is suspicious.</li>
                  <li><span class="text-text">Everyone</span> · Watch how people defend their answers.</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}
