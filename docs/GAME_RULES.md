# DÉJÀ VU — Game Rules

## Overview

Each round, players share a "memory" - an evocative scenario. ONE player is the **WITNESS** - they were there, they have fragments of real memory. The others are **IMPOSTERS** - they weren't there, but must fabricate convincing details to blend in.

Through questioning and intuition, players vote on who they believe is the real Witness. Points are earned for successful deception, accurate deduction, and masterful misdirection.

**The Twist:** Even the Witness doesn't remember everything perfectly. They receive only FRAGMENTS - partial truths that leave room for doubt.

---

## Setup

1. **Host creates a game room** with configuration:
   - Number of rounds (3, 5, or 7)
   - Time scale (50%-150% of default timings)
   - Max players (3-8)
   - Witness count (Auto, 1, or 2)
   - Spectator allowance (on/off)
   - Voice chat (on/off)

2. **Players join** via 6-character room code (e.g., "ABC123")
3. **Each player picks** a display name for this game
4. **If voice enabled**, players connect to voice chat (always-on, mute toggle available)
5. **Host starts game** when 3+ players are ready

---

## Round Structure

Each round follows 6 phases:

### Phase 1: MEMORY (5 seconds)

- A memory prompt is revealed to all players
- Evocative, open-ended scenario
- Example: *"The last day of summer. A goodbye at a train station. Something was left behind on the platform."*

### Phase 2: ROLE ASSIGNMENT (5 seconds, PRIVATE)

- Server secretly assigns roles:
  - 1 WITNESS (or 2 with 6+ players, if configured)
  - All others are IMPOSTERS
- WITNESS receives 3 FRAGMENTS (specific true details)
- IMPOSTERS receive 1-2 HINTS (vague, could match anything)

### Phase 3: DETAILS (45 seconds)

- A specific question is asked about the memory
- Example: *"What was the weather like?"*
- ALL players type their answer simultaneously (hidden)
- WITNESS uses fragments to guide truthful answer
- IMPOSTERS fabricate plausible details
- Answers revealed simultaneously when all submit or time out

### Phase 4: QUESTIONING (90 seconds)

- All answers are displayed
- Players take turns asking follow-up questions
- Any player can question any other player
- Questioned player must respond in real-time
- Goal: Expose inconsistencies or suspicious vagueness
- Anyone can call for vote early (requires 50% agreement)

### Phase 5: VOTING (30 seconds)

- Each player votes for who they believe is the WITNESS
- Cannot vote for yourself
- Votes are hidden until all cast
- Can abstain (costs no points, gains none)

### Phase 6: RESULTS (10 seconds or until host continues)

- WITNESS identity revealed
- Votes displayed
- Points awarded (see Scoring System)
- The WITNESS's actual fragments shown (the "truth")

---

## Roles

### ◈ THE WITNESS

**YOU WERE THERE. You remember.**

**Receives:**
- 3 FRAGMENTS - Specific, true details about the memory
- Example fragments for "train station goodbye":
  - "It was raining softly"
  - "She wore a blue coat"
  - "The item left behind: an umbrella"

**Goal:**
- Answer truthfully (using fragments as guide)
- BUT appear uncertain enough to blend with imposters
- If EVERYONE guesses you correctly: 0 points
- If SOME guess wrong: Bonus points for deception

**Strategy:**
- Be truthful but not TOO specific (suspicious)
- Add small uncertainties: "I think it was..." "Maybe..."
- Don't reveal all fragments at once

---

### ● THE IMPOSTER

**YOU WEREN'T THERE. Fabricate. Blend in.**

**Receives:**
- 1-2 HINTS - Vague clues that could fit many scenarios
- Example hints:
  - "The weather was notable"
  - "Someone was wearing something memorable"

**Goal:**
- Fabricate believable details
- Identify and vote for the real Witness
- Points for fooling others AND correct deduction

**Strategy:**
- Use common tropes (rain, sunset, crowded, empty)
- Mirror the tone of others' answers
- Add emotional details (harder to verify)
- Watch for who's TOO certain (might be witness)
- Watch for who's TOO vague (also might be witness bluffing)

---

### 👁 THE SPECTATOR

**You watch. You learn. You wait.**

**Can see:**
- Memory prompts
- All submitted details
- Questions and answers
- Votes (after reveal)
- Results and scores

**Cannot see:**
- Role assignments (until reveal)
- Fragments/Hints (until reveal)

**Can do:**
- Request to join (host approves)
- Leave anytime

---

## Voice Chat

When voice is enabled:

- **Always-on** — No push-to-talk, natural conversation flow
- **Mute toggle** — Tap to mute/unmute yourself
- **Deafen** — Stop hearing others (also mutes you)
- **Voice Activity Detection** — Filters background noise automatically

Voice is especially important during the **Questioning phase** where real-time conversation reveals hesitation, tone, and social cues that text cannot capture.

**Controls:**
- Mute: Quick tap, thumb-reachable
- Deafen: Long press or secondary action
- Speaking indicator: Visual feedback when transmitting

---

## Witness Count by Player Count

| Players | Witnesses | Imposters |
|---------|-----------|-----------|
| 3       | 1         | 2         |
| 4       | 1         | 3         |
| 5       | 1         | 4         |
| 6       | 1 or 2*   | 5 or 4    |
| 7       | 1 or 2*   | 6 or 5    |
| 8       | 1 or 2*   | 7 or 6    |

*Host configurable*

### Two Witness Mode

When 2 witnesses are active:
- Both receive the SAME fragments
- Both are trying to blend in
- Imposters must identify BOTH to score full points
- Witnesses don't know who the other witness is
- Creates interesting dynamics where witnesses might accidentally corroborate each other (or contradict!)

---

## Scoring System

### For Imposters

| Action                      | Points |
|-----------------------------|--------|
| Correct Witness Vote        | +2     |
| Received Vote (per vote)    | +1     |

*Maximum per round: n+1 points (where n = number of players)*

### For Witness

| Action                      | Points   |
|-----------------------------|----------|
| Per player who voted WRONG  | +1       |
| NOBODY voted for you        | +3 bonus |
| EVERYONE voted for you      | +0       |

*Maximum per round: n+2 points (where n = number of players)*

### Special Cases

| Situation                   | Points      |
|-----------------------------|-------------|
| Abstained from voting       | +0 / -0     |
| Disconnected (auto-abstain) | +0 / -0     |
| Vote for yourself           | NOT ALLOWED |

---

## Scoring Examples

### Example 1: 5 players, NOVA is witness

**Votes:** GHOST→NOVA, CIPHER→PRISM, PRISM→NOVA, ECHO→NOVA

**Results:**
- NOVA (Witness): 1 wrong vote (CIPHER) = **+1 point**
- GHOST (Imposter): Correct vote +2, 0 received = **+2 points**
- CIPHER (Imposter): Wrong vote +0, 1 received = **+1 point**
- PRISM (Imposter): Correct vote +2, 0 received = **+2 points**
- ECHO (Imposter): Correct vote +2, 0 received = **+2 points**

### Example 2: 4 players, witness fools everyone

NOVA is witness. **Votes:** GHOST→CIPHER, CIPHER→GHOST, PRISM→GHOST

**Results:**
- NOVA (Witness): 3 wrong votes = +3, nobody bonus = +3, **Total: +6 points** (huge round!)
- GHOST (Imposter): Wrong vote +0, 2 received = **+2 points**
- CIPHER (Imposter): Wrong vote +0, 1 received = **+1 point**
- PRISM (Imposter): Wrong vote +0, 0 received = **+0 points**

---

## Tiebreaker

If final scores are tied:
1. Most correct witness guesses (as imposter)
2. Most rounds as witness without being unanimously caught
3. Earliest joined (first tiebreaker - rewards punctuality)

---

## Game End

The game ends when:
1. **All configured rounds completed** - Normal ending
2. **Fewer than 3 players remain** - Insufficient players
3. **Host force ends** - Manual termination

Final scores displayed, winner announced, stats shown.
