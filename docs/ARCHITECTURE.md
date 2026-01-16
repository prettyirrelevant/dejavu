# DÉJÀ VU — Architecture

## Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | SolidJS | Fine-grained reactivity, small bundle |
| Styling | Tailwind CSS v4 | CSS-first, design tokens |
| Hosting | Cloudflare Pages | Edge-deployed frontend |
| API | Cloudflare Workers + Hono | Lightweight edge routing |
| Realtime | Durable Objects | Stateful WebSocket game rooms |
| Voice | Cloudflare Calls (RealtimeKit) | WebRTC SFU for group voice |
| AI | Workers AI | Memory prompt generation |
| Validation | Zod | Shared schemas, runtime safety |

## Monorepo Structure

```
dejavu/
├── apps/
│   └── web/                      # SolidJS frontend
│       ├── src/
│       │   ├── routes/           # File-based routes
│       │   │   ├── index.tsx     # Home (/)
│       │   │   └── [code].tsx    # Room (/:roomCode)
│       │   ├── components/       # UI components
│       │   ├── stores/           # Global state
│       │   ├── lib/              # Utilities
│       │   │   ├── ws.ts         # WebSocket client
│       │   │   ├── voice.ts      # RealtimeKit integration
│       │   │   └── storage.ts    # LocalStorage helpers
│       │   ├── app.tsx
│       │   └── entry-client.tsx
│       ├── public/
│       ├── package.json
│       ├── vite.config.ts
│       └── tailwind.config.ts
│
├── packages/
│   ├── server/                   # Cloudflare Workers
│   │   ├── src/
│   │   │   ├── index.ts          # Hono routes
│   │   │   ├── room.ts           # GameRoom Durable Object
│   │   │   ├── voice.ts          # Calls token generation
│   │   │   └── game/
│   │   │       ├── engine.ts     # State machine
│   │   │       ├── scoring.ts    # Point calculation
│   │   │       └── prompts.ts    # Workers AI integration
│   │   ├── wrangler.toml
│   │   └── package.json
│   │
│   └── shared/                   # Shared code
│       ├── src/
│       │   ├── types.ts          # TypeScript types
│       │   ├── messages.ts       # Zod schemas
│       │   └── constants.ts      # Game constants
│       └── package.json
│
├── docs/                         # Documentation
│   ├── ARCHITECTURE.md
│   ├── GAME_RULES.md
│   ├── PROTOCOL.md
│   └── STATE_MACHINES.md
│
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

## Routing

Two routes, state-driven views:

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Home | Create or join a room |
| `/:roomCode` | Room | Lobby → Game → Results (server-driven) |

The room code is the route. All in-room transitions are state changes, not navigation.

## Frontend State

```
┌─────────────────────────────────────────────────────┐
│                    SolidJS App                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│   ┌─────────────┐     ┌─────────────────────────┐   │
│   │   Stores    │     │       Components        │   │
│   ├─────────────┤     ├─────────────────────────┤   │
│   │ game        │────▶│ Room                    │   │
│   │ - phase     │     │ ├── Lobby               │   │
│   │ - players   │     │ ├── Memory              │   │
│   │ - round     │     │ ├── Roles               │   │
│   │ - role      │     │ ├── Details             │   │
│   │ - ...       │     │ ├── Questions           │   │
│   │             │     │ ├── Voting              │   │
│   │ connection  │     │ └── Results             │   │
│   │ - status    │     │                         │   │
│   │ - latency   │     │ Home                    │   │
│   │             │     │ ├── CreateForm          │   │
│   │ voice       │     │ └── JoinForm            │   │
│   │ - muted     │     │                         │   │
│   │ - speaking  │     │ Shared                  │   │
│   │ - peers     │     │ ├── VoiceControls       │   │
│   │             │     │ ├── PlayerList          │   │
│   │ user        │     │ ├── Timer               │   │
│   │ - name      │     │ └── ...                 │   │
│   │ - prefs     │     │                         │   │
│   └─────────────┘     └─────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

State flows unidirectionally:
1. Server sends message via WebSocket
2. Message handler updates store
3. Components reactively re-render

## WebSocket Connection

```
┌──────────┐                              ┌──────────────────┐
│  Client  │                              │  Durable Object  │
│          │                              │    (GameRoom)    │
└────┬─────┘                              └────────┬─────────┘
     │                                             │
     │  connect to /rooms/:code                    │
     │────────────────────────────────────────────▶│
     │                                             │
     │  join_room {name, asSpectator?}             │
     │────────────────────────────────────────────▶│
     │                                             │
     │           room_joined {sessionToken, ...}   │
     │◀────────────────────────────────────────────│
     │                                             │
     │  ◀──── bidirectional messages ────▶         │
     │                                             │
     │  ping {clientTime}                          │
     │────────────────────────────────────────────▶│
     │           pong {serverTime}                 │
     │◀────────────────────────────────────────────│
     │                                             │
```

Reconnection flow:
1. Client stores `sessionToken` in LocalStorage
2. On disconnect, client attempts reconnect
3. Client sends `reconnect {roomCode, sessionToken}`
4. Server validates token, restores player state
5. Server sends `reconnect_success` with current game state

## Voice Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Cloudflare Calls                         │
│                   (SFU - Selective Forwarding)               │
└──────────────────────────────────────────────────────────────┘
         ▲              ▲              ▲              ▲
         │ audio        │ audio        │ audio        │ audio
         ▼              ▼              ▼              ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │ Player1 │    │ Player2 │    │ Player3 │    │ Player4 │
    └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

Integration:
1. Player joins room via WebSocket
2. Server generates Calls auth token (scoped to room)
3. Client receives token in `room_joined` / `room_created`
4. Client initializes RealtimeKit with token
5. Audio tracks routed through Cloudflare SFU
6. Mute/deafen state synced via existing WebSocket (not Calls)

RealtimeKit SDK handles:
- Peer connection management
- Voice activity detection (VAD)
- Automatic onus handling
- Ouality adaptation

Game server handles:
- Token generation/validation
- Voice status broadcasting
- Mute state synchronization

## Local Storage

```typescript
dejavu:name                    // "NOVA"
dejavu:preferences             // {theme: "system", defaultMuted: false}
dejavu:session:{roomCode}      // {token: "...", playerId: "...", expiry: 1234567890}
```

| Key | Purpose | Lifetime |
|-----|---------|----------|
| `name` | Pre-fill join form | Permanent |
| `preferences` | Theme, audio defaults | Permanent |
| `session:{code}` | Reconnection | Until game ends or TTL expires |

## Server Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Workers                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                   Hono Router                       │   │
│   ├─────────────────────────────────────────────────────┤   │
│   │  POST /rooms           → Create room, return code   │   │
│   │  GET  /rooms/:code     → WebSocket upgrade          │   │
│   │  GET  /health          → Health check               │   │
│   └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              Durable Object: GameRoom               │   │
│   ├─────────────────────────────────────────────────────┤   │
│   │  - WebSocket connections (Map<playerId, socket>)    │   │
│   │  - Game engine (state machine)                      │   │
│   │  - Alarm-based phase transitions                    │   │
│   │  - Player management                                │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   Bindings:                                                 │
│   - GAME_ROOM: DurableObjectNamespace                       │
│   - AI: Workers AI                                          │
│   - CALLS: Cloudflare Calls credentials                     │
│   - ANALYTICS: AnalyticsEngineDataset                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Cloudflare Bindings

```toml
# wrangler.toml

name = "dejavu-server"
main = "src/index.ts"
compatibility_date = "2025-01-01"

[durable_objects]
bindings = [{ name = "GAME_ROOM", class_name = "GameRoom" }]

[[migrations]]
tag = "v1"
new_classes = ["GameRoom"]

[ai]
binding = "AI"

[[analytics_engine_datasets]]
binding = "ANALYTICS"
dataset = "dejavu"

[vars]
CALLS_APP_ID = ""

# Secret (set via wrangler secret put)
# CALLS_APP_SECRET
```

## Design System

### Design References

| Source | Focus |
|--------|-------|
| [Vercel Web Interface Guidelines](https://vercel.com/design/guidelines) | Interactions, accessibility, performance, polish |
| Jony Ive Philosophy | Reduction, purpose, clarity, materiality |

### Core Principles

| Principle | Application |
|-----------|-------------|
| Reduction | Only essential elements. No decoration without function. |
| Clarity | Typography establishes hierarchy. No competing focal points. |
| Touch | 44px minimum tap targets. Thumb-reachable controls. |
| Space | Generous margins. Content breathes. |
| Motion | Subtle, purposeful. 150-300ms transitions. |
| Color | Restrained palette. Meaning through contrast. |

### Vercel Guidelines (Key Selections)

#### Interactions

- Keyboard works everywhere (WAI-ARIA patterns)
- Clear focus rings (`:focus-visible` over `:focus`)
- 44px minimum touch targets on mobile
- Input font ≥16px to prevent iOS zoom
- Loading buttons keep original label + show spinner
- Optimistic updates with rollback on failure
- Confirm destructive actions

#### Animations

- Honor `prefers-reduced-motion`
- GPU-accelerated properties only (`transform`, `opacity`)
- Never `transition: all`
- Interruptible by user input
- Correct transform origin

#### Layout

- Optical alignment (±1px when perception beats geometry)
- Responsive: mobile, laptop, ultra-wide
- Respect safe areas (notches, insets)
- Let the browser size things (flex/grid over JS measurement)

#### Content

- All states designed (empty, sparse, dense, error)
- No dead ends — every screen offers a next step
- Stable skeletons mirror final content
- Tabular numbers for scores (`font-variant-numeric: tabular-nums`)
- Icons have labels (accessible names)

#### Forms

- Enter submits
- Labels everywhere
- Submit enabled until in-flight (then disable + spinner)
- Errors next to fields, focus first error on submit
- Don't block paste

#### Performance

- Minimize re-renders
- Virtualize large lists
- Network latency <500ms for mutations
- Preload critical fonts
- No layout shift from images

#### Polish

- Layered shadows (ambient + direct light)
- Nested radii (child ≤ parent, concentric curves)
- Interactions increase contrast (hover/active/focus)
- `color-scheme: dark` on `<html>` for proper scrollbars
- `<meta name="theme-color">` matches background

### Color Strategy

System preference with manual override:

```
┌─────────────────────────────────────────┐
│  prefers-color-scheme: dark             │
│  ┌───────────────────────────────────┐  │
│  │  Background    neutral-950        │  │
│  │  Surface       neutral-900        │  │
│  │  Text          neutral-50         │  │
│  │  Muted         neutral-400        │  │
│  │  Accent        (TBD)              │  │
│  │  Witness       amber-500          │  │
│  │  Imposter      neutral-500        │  │
│  │  Error         red-500            │  │
│  │  Success       green-500          │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  prefers-color-scheme: light            │
│  ┌───────────────────────────────────┐  │
│  │  Background    white              │  │
│  │  Surface       neutral-50         │  │
│  │  Text          neutral-900        │  │
│  │  Muted         neutral-500        │  │
│  │  Accent        (TBD)              │  │
│  │  Witness       amber-600          │  │
│  │  Imposter      neutral-600        │  │
│  │  Error         red-600            │  │
│  │  Success       green-600          │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Typography

```
Font Stack: System UI (native feel, zero load time)

Hierarchy:
- Display    2.5rem / 700   (Game titles, winner announcement)
- Heading    1.5rem / 600   (Phase names, section headers)
- Body       1rem   / 400   (Primary content)
- Caption    0.875rem / 400 (Secondary info, timestamps)
- Mono       0.875rem / 400 (Room codes, timers)
```

### Mobile-First Breakpoints

```
Default        < 640px    Phone (primary design target)
sm             ≥ 640px    Large phone / small tablet
md             ≥ 768px    Tablet
lg             ≥ 1024px   Desktop
```

All layouts designed for 320px minimum width.

## Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                        GitHub                                │
│                          │                                   │
│                    push to main                              │
│                          ▼                                   │
│               ┌─────────────────────┐                        │
│               │   GitHub Actions    │                        │
│               └─────────┬───────────┘                        │
│                         │                                    │
│           ┌─────────────┴─────────────┐                      │
│           ▼                           ▼                      │
│   ┌───────────────┐           ┌───────────────┐              │
│   │ pnpm build    │           │ wrangler      │              │
│   │ (apps/web)    │           │ deploy        │              │
│   └───────┬───────┘           │ (packages/    │              │
│           │                   │  server)      │              │
│           ▼                   └───────┬───────┘              │
│   ┌───────────────┐                   │                      │
│   │ Cloudflare    │                   │                      │
│   │ Pages         │◀──────────────────┘                      │
│   └───────────────┘                                          │
│                                                              │
│   URLs:                                                      │
│   - dejavu.pages.dev (frontend)                              │
│   - dejavu-server.workers.dev (API/WebSocket)                │
│   - Custom domain: dejavu.app (optional)                     │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Foundation
- Monorepo setup
- Shared types and schemas
- Basic Workers + Durable Object
- WebSocket connection
- SolidJS app scaffold
- Home screen (create/join)

### Phase 2: Lobby
- Room creation and joining
- Player list with ready state
- Host controls
- Name editing
- LocalStorage persistence

### Phase 3: Game Loop
- Phase state machine
- Memory/Roles/Details screens
- Timer component
- Submission handling

### Phase 4: Interaction
- Questions phase
- Voting phase
- Results display
- Score tracking

### Phase 5: Voice
- Cloudflare Calls integration
- RealtimeKit setup
- Mute/deafen controls
- Voice status indicators

### Phase 6: Polish
- Workers AI prompt generation
- Reconnection handling
- Error states
- Animations
- Responsive refinement

### Phase 7: Launch
- Custom domain
- Analytics
- Monitoring
- Documentation
