import { createSignal, Show } from 'solid-js';

export default function HowToPlay() {
  const [isOpen, setIsOpen] = createSignal(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        class="text-sm text-muted underline underline-offset-2 hover:text-text"
      >
        How to Play
      </button>

      <Show when={isOpen()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
          <div class="max-h-[85vh] w-full max-w-md overflow-y-auto bg-background">
            <div class="sticky top-0 flex items-center justify-between border-b border-border bg-background px-6 py-4">
              <h2 class="text-lg font-semibold text-text tracking-tight">How to Play</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                class="text-muted hover:text-text transition-colors"
              >
                <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="flex flex-col divide-y divide-border">
              <section class="px-6 py-5">
                <p class="text-sm text-muted leading-relaxed">
                  Something strange happened. One or two of you actually saw it.
                  The rest are making it up. Find the <span class="text-witness">Witness</span> before 
                  the <span class="text-imposter">Imposters</span> fool everyone.
                </p>
              </section>

              <section class="px-6 py-5">
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

              <section class="px-6 py-5">
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

              <section class="px-6 py-5">
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

              <section class="px-6 py-5 bg-surface/50">
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
