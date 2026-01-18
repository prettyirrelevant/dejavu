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
                <h3 class="font-semibold text-text mb-2">The Concept</h3>
                <p class="text-muted">
                  Something strange happened and everyone claims they saw it. But only the 
                  <span class="text-witness font-medium"> Witness</span> actually knows the real details.
                  Everyone else is an <span class="text-imposter font-medium">Imposter</span> making things up.
                  Your job is to figure out who's telling the truth.
                </p>
              </section>

              <section>
                <h3 class="font-semibold text-text mb-2">The Roles</h3>
                <div class="flex flex-col gap-3 text-muted">
                  <div class="border border-witness/30 bg-witness/5 p-3">
                    <p class="text-witness font-medium mb-1">Witness</p>
                    <p class="text-xs">You receive the actual memory fragments with specific details like exact colors, numbers, and quotes. Your goal is to answer questions accurately without being too obvious about knowing the truth.</p>
                  </div>
                  <div class="border border-imposter/30 bg-imposter/5 p-3">
                    <p class="text-imposter font-medium mb-1">Imposter</p>
                    <p class="text-xs">You only get vague hints about the scenario. You need to make up convincing details and blend in. Try to spot the Witness by watching who seems too confident or specific.</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 class="font-semibold text-text mb-2">Game Flow</h3>
                <ol class="flex flex-col gap-3 text-muted">
                  <li class="flex gap-3">
                    <span class="flex size-5 items-center justify-center rounded-full bg-muted/20 text-xs font-medium">1</span>
                    <div>
                      <span class="text-text font-medium">Memory</span>
                      <p class="text-xs mt-0.5">Everyone sees the same scenario. Read it carefully because you'll need to answer questions about it.</p>
                    </div>
                  </li>
                  <li class="flex gap-3">
                    <span class="flex size-5 items-center justify-center rounded-full bg-muted/20 text-xs font-medium">2</span>
                    <div>
                      <span class="text-text font-medium">Roles Revealed</span>
                      <p class="text-xs mt-0.5">The Witness sees 4 specific details (colors, quotes, numbers). Imposters see 4 vague hints they'll use to fake their answers.</p>
                    </div>
                  </li>
                  <li class="flex gap-3">
                    <span class="flex size-5 items-center justify-center rounded-full bg-muted/20 text-xs font-medium">3</span>
                    <div>
                      <span class="text-text font-medium">Answer Time</span>
                      <p class="text-xs mt-0.5">A question appears about the scenario. Everyone writes their answer privately. The Witness knows the truth but Imposters must invent something believable.</p>
                    </div>
                  </li>
                  <li class="flex gap-3">
                    <span class="flex size-5 items-center justify-center rounded-full bg-muted/20 text-xs font-medium">4</span>
                    <div>
                      <span class="text-text font-medium">Discussion</span>
                      <p class="text-xs mt-0.5">All answers are revealed side by side. Talk with your group! Question suspicious answers. Look for people who are too vague or too specific.</p>
                    </div>
                  </li>
                  <li class="flex gap-3">
                    <span class="flex size-5 items-center justify-center rounded-full bg-muted/20 text-xs font-medium">5</span>
                    <div>
                      <span class="text-text font-medium">Vote</span>
                      <p class="text-xs mt-0.5">Everyone votes for who they think is the Witness. You cannot vote for yourself. Results are revealed after everyone votes.</p>
                    </div>
                  </li>
                </ol>
              </section>

              <section>
                <h3 class="font-semibold text-text mb-2">Scoring</h3>
                <ul class="flex flex-col gap-2 text-muted">
                  <li class="flex gap-2 items-start">
                    <span class="text-success font-bold w-8">+10</span>
                    <span>You correctly voted for the Witness</span>
                  </li>
                  <li class="flex gap-2 items-start">
                    <span class="text-witness font-bold w-8">+5</span>
                    <span>You're the Witness and someone voted for the wrong person</span>
                  </li>
                </ul>
                <p class="text-xs text-muted/70 mt-2">The player with the most points after all rounds wins!</p>
              </section>

              <section class="border-t border-border pt-4">
                <h3 class="font-semibold text-text mb-2">Tips</h3>
                <ul class="flex flex-col gap-1.5 text-xs text-muted">
                  <li><span class="text-witness">Witnesses:</span> Don't be too accurate. Throw in a small "mistake" to seem like you're guessing too.</li>
                  <li><span class="text-imposter">Imposters:</span> Confidence sells. Pick specific details and commit to them fully.</li>
                  <li><span class="text-text">Everyone:</span> Pay attention to how people defend their answers, not just what they wrote.</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}
