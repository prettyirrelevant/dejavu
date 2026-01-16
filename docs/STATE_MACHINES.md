# DÉJÀ VU — State Machines

## 1. Game State Machine

This state machine governs the overall game lifecycle.

```
                        ┌─────────────┐
                        │             │
           ┌───────────▶│    IDLE     │◀────────────────┐
           │            │             │                 │
           │            └──────┬──────┘                 │
           │                   │                        │
           │                   │ CreateRoom             │
           │                   ▼                        │
           │            ┌─────────────┐                 │
           │            │             │                 │
           │            │   LOBBY     │                 │
           │            │             │                 │
           │            └──────┬──────┘                 │
           │                   │                        │
           │                   │ StartGame              │
           │                   │ (3+ players ready)     │
           │                   ▼                        │
           │            ┌─────────────┐                 │
           │            │             │                 │
           │            │  PLAYING    │─────────────────┤
           │            │             │  AllPlayersLeft │
           │            └──────┬──────┘                 │
           │                   │                        │
           │                   │ AllRoundsComplete      │
           │                   │ OR ForceEnd            │
           │                   ▼                        │
           │            ┌─────────────┐                 │
           │            │             │                 │
           │            │  FINISHED   │                 │
           │            │             │                 │
           │            └──────┬──────┘                 │
           │                   │                        │
           │                   │ Timeout (5 min)        │
           │                   │ OR HostClose           │
           └───────────────────┴────────────────────────┘
```

### State Descriptions

#### IDLE

- Room does not exist yet
- Server waiting for CreateRoom command
- **Transitions:** CreateRoom → LOBBY

#### LOBBY

- Room exists, players can join/leave
- Host can configure settings
- Players can toggle ready status
- Spectators can join

**Valid actions:**
- JoinRoom (player or spectator)
- LeaveRoom
- SetReady (toggle)
- UpdateConfig (host only)
- StartGame (host only, requires 3+ ready players)

**Transitions:**
- StartGame → PLAYING
- AllPlayersLeave → IDLE (room destroyed)
- Timeout (30 min inactive) → IDLE

#### PLAYING

- Game is in progress
- Round state machine is active
- No new players can join (spectators can)
- Disconnected players can rejoin

**Valid actions:**
- All round-specific actions
- SpectatorJoin
- PlayerRejoin
- ForceEnd (host only)

**Transitions:**
- AllRoundsComplete → FINISHED
- ForceEnd → FINISHED
- <3 players remain → FINISHED

#### FINISHED

- Game complete, showing final results
- Players can view final scores, statistics
- Host can start new game (returns to LOBBY)

**Valid actions:**
- ViewStats
- NewGame (host only) → LOBBY
- Leave

**Transitions:**
- NewGame → LOBBY
- Timeout (5 min) → IDLE (room destroyed)
- AllPlayersLeave → IDLE

---

## 2. Round State Machine

Active when GameState = PLAYING. Each round cycles through these phases.

```
                   ┌──────────────┐
                   │              │
   ┌──────────────▶│ ROUND_START  │
   │               │              │
   │               └──────┬───────┘
   │                      │ Auto (immediate)
   │                      ▼
   │               ┌──────────────┐
   │               │    MEMORY    │  (5 seconds)
   │               └──────┬───────┘
   │                      │ Timer expires
   │                      ▼
   │               ┌──────────────┐
   │               │    ROLES     │  (5 seconds)
   │               └──────┬───────┘
   │                      │ Timer expires
   │                      ▼
   │               ┌──────────────┐
   │               │   DETAILS    │  (45 seconds)
   │               └──────┬───────┘
   │                      │ AllSubmitted OR Timer
   │                      ▼
   │               ┌──────────────┐
   │               │  QUESTIONS   │  (90 seconds)
   │               └──────┬───────┘
   │                      │ Timer OR VoteCalled
   │                      ▼
   │               ┌──────────────┐
   │               │   VOTING     │  (30 seconds)
   │               └──────┬───────┘
   │                      │ AllVoted OR Timer
   │                      ▼
   │               ┌──────────────┐
   │               │   RESULTS    │  (10 sec or HostContinue)
   │               └──────┬───────┘
   │                      │
   │           ┌──────────┴──────────┐
   │           │                     │
   │     More rounds           Game over
   │           │                     │
   │           ▼                     ▼
   │    ┌──────────┐          ┌──────────┐
   └────│  NEXT    │          │   END    │──────▶ GameState.FINISHED
        │  ROUND   │          │  GAME    │
        └──────────┘          └──────────┘
```

### Phase Details

#### ROUND_START

**Duration:** Instant (0 seconds)

**Server actions:**
- Increment round counter
- Select random memory prompt (no repeats within game)
- Select random detail question for this prompt
- Assign roles (random witness selection)
- Generate fragments for witness
- Generate hints for imposters

**Broadcast:** `RoundStarted { roundNumber, totalRounds }`

**Transition:** Immediate → MEMORY

#### MEMORY

**Duration:** 5 seconds (× time scale)

**Server actions:**
- Start phase timer

**Broadcast:** `MemoryRevealed { prompt, timeRemaining }`

**Transition:** Timer expires → ROLES

#### ROLES

**Duration:** 5 seconds (× time scale)

**Server actions:**
- Send private role assignment to each player

**Private to WITNESS:** `RoleAssigned { role: "witness", fragments: [...] }`

**Private to IMPOSTERS:** `RoleAssigned { role: "imposter", hints: [...] }`

**Private to SPECTATORS:** `PhaseChanged { phase: "roles", message: "Roles assigned" }`

**Transition:** Timer expires → DETAILS

#### DETAILS

**Duration:** 45 seconds (× time scale)

**Server actions:**
- Broadcast the detail question
- Accept SubmitDetail from players
- Track who has submitted (broadcast status updates)

**Broadcast:** `DetailQuestion { question, timeRemaining }`

**Broadcast:** `PlayerSubmitted { playerId }` (on each submit)

**Player action:** `SubmitDetail { answer: string }`
- Max 280 characters
- Can edit until phase ends (last submission counts)

**Auto-submit on timeout:** "[Lost in thought...]"

**Transition:** AllSubmitted OR Timer → QUESTIONS

#### QUESTIONS

**Duration:** 90 seconds (× time scale)

**Server actions:**
- Reveal all submitted details simultaneously
- Route questions and answers between players
- Track vote-call requests

**Broadcast:** `DetailsRevealed { details: { playerId: answer } }`

**Player actions:**
- `AskQuestion { targetId, question: string }`
- `AnswerQuestion { questionId, answer: string }`
- `CallVote { }` (request early voting)

**Vote call:** If 50%+ players call, skip to VOTING immediately

**Transition:** Timer OR VoteCallPassed → VOTING

#### VOTING

**Duration:** 30 seconds (× time scale)

**Server actions:**
- Accept votes from players
- Track who has voted (without revealing votes)

**Broadcast:** `VotingStarted { timeRemaining }`

**Broadcast:** `PlayerVoted { playerId }` (on each vote, no target revealed)

**Player action:** `CastVote { targetId | "abstain" }`
- Cannot vote for self
- Can change vote until phase ends

**Auto-vote on timeout:** "abstain"

**Transition:** AllVoted OR Timer → RESULTS

#### RESULTS

**Duration:** 10 seconds OR until host continues

**Server actions:**
- Calculate scores for this round
- Update total scores
- Prepare results payload

**Broadcast:** `RoundResults { witnessIds, fragments, votes, roundScores, totalScores, roundNumber, totalRounds }`

**Host action:** `ContinueGame { }` (skip timer, go to next)

**Transition:**
- If roundNumber < totalRounds → ROUND_START
- If roundNumber = totalRounds → GameState.FINISHED

---

## 3. Player Connection State Machine

Each player has an independent connection state tracked by server.

```
            ┌───────────────┐
            │               │
    ┌──────▶│   CONNECTED   │◀──────┐
    │       │               │       │
    │       └───────┬───────┘       │
    │               │               │
    │               │ No heartbeat  │
    │               │ for 3 seconds │
    │               ▼               │
    │       ┌───────────────┐       │
    │       │               │       │
    │       │    STALE      │       │
    │       │               │       │
    │       └───────┬───────┘       │
    │               │               │
    │ Reconnect     │ 10 seconds    │ Reconnect
    │ + valid       │               │ + valid
    │ session       ▼               │ session
    │       ┌───────────────┐       │
    │       │               │       │
    └───────│   DEGRADED    │───────┘
            │               │
            └───────┬───────┘
                    │
                    │ 30 seconds
                    ▼
            ┌───────────────┐
            │               │
            │   DROPPED     │
            │               │
            └───────┬───────┘
                    │
                    │ Reconnect
                    │ + valid session
                    │ + game still active
                    ▼
            ┌───────────────┐
            │               │
            │ RECONNECTING  │─────────────────┐
            │  (Spectator   │                 │
            │   til next    │                 │
            │   round)      │                 │
            └───────────────┘                 │
                    │                         │
                    │ Next round starts       │
                    └─────────────────────────┘
                              │
                              ▼
                        CONNECTED
```

### State Details

#### CONNECTED

- WebSocket active, heartbeat received within 3 seconds
- Player can perform all actions for current phase
- Full participant

**Visual indicator:** ● (solid circle, green)

**Other players see:** "NOVA" (normal)

#### STALE

- No heartbeat for 3-10 seconds
- Likely temporary network hiccup
- Player can still perform actions if messages arrive
- Server buffers any broadcasts for replay on reconnect

**Visual indicator:** ◐ (half circle, yellow)

**Other players see:** "NOVA (unstable)"

#### DEGRADED

- No heartbeat for 10-30 seconds
- Auto-actions kick in:
  - DETAILS phase: Submit "[Lost in thought...]"
  - QUESTIONS phase: Can't ask, answers with "..."
  - VOTING phase: Will auto-abstain if not recovered
- Player still "in game" - can recover

**Visual indicator:** ○ (empty circle, orange)

**Other players see:** "NOVA (connection issues)"

#### DROPPED

- No heartbeat for 30+ seconds
- Removed from active play
- Remaining players continue without them
- CAN rejoin if game still active (becomes RECONNECTING)

**If was WITNESS this round:**
- Round is VOIDED (no points awarded)
- Prompt is discarded, new round begins immediately
- Players notified: "Round void - witness disconnected"

**Visual indicator:** ✕ (x mark, red)

**Other players see:** "NOVA (disconnected)"

**Game continuity check:**
- If 3+ players remain → Game continues
- If <3 players remain → Game ends (FINISHED)

#### RECONNECTING

- Player reconnected after being DROPPED
- Temporary spectator status until round ends
- Full sync of current game state
- Rejoins as active player next round

**Visual indicator:** ◎ (double circle, blue)

**Other players see:** "NOVA (rejoined, spectating)"

**Transition:** Next round → CONNECTED (full player)

---

## Heartbeat Protocol

**Client sends:** `{ type: "ping", timestamp: <unix_ms> }`

**Server responds:** `{ type: "pong", timestamp: <unix_ms> }`

**Frequency:** Client sends ping every 2 seconds

**Timeout detection:** Server expects ping within 3 seconds

**Latency tracking:** Server calculates RTT from ping/pong

**High latency warning:** If RTT > 500ms, warn player

---

## Game Over Decision Flowchart

```
           ┌───────────────────────┐
           │   Something happens   │
           └───────────┬───────────┘
                       │
                       ▼
           ┌───────────────────────┐
           │  All rounds done?     │
           └───────────┬───────────┘
                       │
            YES ◀──────┴──────▶ NO
             │                   │
             ▼                   ▼
      ┌───────────┐    ┌───────────────────────┐
      │  GAME     │    │  >=3 players remain?  │
      │  OVER     │    └───────────┬───────────┘
      │ (normal)  │                │
      └───────────┘     YES ◀──────┴──────▶ NO
                         │                   │
                         ▼                   ▼
                ┌────────────────┐    ┌───────────┐
                │  Host force    │    │  GAME     │
                │  ended?        │    │  OVER     │
                └───────┬────────┘    │ (players) │
                        │             └───────────┘
             YES ◀──────┴──────▶ NO
              │                   │
              ▼                   ▼
       ┌───────────┐      ┌─────────────┐
       │  GAME     │      │  CONTINUE   │
       │  OVER     │      │  PLAYING    │
       │  (host)   │      └─────────────┘
       └───────────┘
```
