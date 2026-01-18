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
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
          <div class="max-h-[85vh] w-full max-w-md overflow-y-auto border border-border bg-background p-6">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-text">How to Play</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                class="text-muted hover:text-text"
              >
                <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="flex flex-col gap-5 text-sm">
              <section>
                <h3 class="font-semibold text-text mb-2">What's this?</h3>
                <p class="text-muted">
                  A weird thing happened. One of you actually saw it. 
                  The rest of you? Total liars. Vote to find the 
                  <span class="text-witness font-medium"> Witness</span> before the 
                  <span class="text-imposter font-medium"> Imposters</span> fool everyone.
                </p>
              </section>

              <section>
                <h3 class="font-semibold text-text mb-2">How it works</h3>
                <ol class="flex flex-col gap-3 text-muted">
                  <li class="flex gap-3">
                    <span class="font-mono text-xs text-muted/60 w-4">1.</span>
                    <div>
                      <span class="text-text font-medium">The Setup</span> — Everyone reads a strange scenario
                    </div>
                  </li>
                  <li class="flex gap-3">
                    <span class="font-mono text-xs text-muted/60 w-4">2.</span>
                    <div>
                      <span class="text-text font-medium">Secret Info</span> — The Witness gets the real details. Imposters get... vibes.
                    </div>
                  </li>
                  <li class="flex gap-3">
                    <span class="font-mono text-xs text-muted/60 w-4">3.</span>
                    <div>
                      <span class="text-text font-medium">Write It Down</span> — Everyone answers a question. Sound convincing.
                    </div>
                  </li>
                  <li class="flex gap-3">
                    <span class="font-mono text-xs text-muted/60 w-4">4.</span>
                    <div>
                      <span class="text-text font-medium">Interrogate</span> — Read the answers. Grill each other. Get suspicious.
                    </div>
                  </li>
                  <li class="flex gap-3">
                    <span class="font-mono text-xs text-muted/60 w-4">5.</span>
                    <div>
                      <span class="text-text font-medium">Vote</span> — Point fingers. Who actually remembers this?
                    </div>
                  </li>
                </ol>
              </section>

              <section>
                <h3 class="font-semibold text-text mb-2">Points</h3>
                <ul class="flex flex-col gap-2 text-muted">
                  <li class="flex gap-2">
                    <span class="text-success font-medium">+10</span>
                    <span>You caught a Witness</span>
                  </li>
                  <li class="flex gap-2">
                    <span class="text-witness font-medium">+5</span>
                    <span>You're the Witness and someone voted wrong</span>
                  </li>
                </ul>
              </section>

              <section class="border-t border-border pt-4">
                <p class="text-muted text-xs italic">
                  Pro tip: Witnesses — don't be too perfect. Imposters — confidence beats accuracy.
                </p>
              </section>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}
