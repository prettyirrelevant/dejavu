# DEJAVU

A social deduction party game where memory meets deception.

## What is it?

DEJAVU is a multiplayer party game where players try to identify who among them actually witnessed a strange event, and who is faking it.

Every round, an AI generates a quirky scenario. One or two players become **Witnesses** and receive the real details. Everyone else becomes **Imposters** who must fabricate convincing answers from vague hints.

## How it works

1. Everyone reads the same scenario
2. Witnesses get specific details, Imposters get vague hints
3. All players answer a question about what happened
4. Players discuss via voice chat, interrogating each other
5. Vote on who you think witnessed the real event

## Tech Stack

- **Frontend**: SolidJS, Tailwind CSS v4, Vite
- **Backend**: Cloudflare Workers, Durable Objects, Hono
- **Voice**: Daily.co WebRTC
- **AI**: Google Gemini 2.0 Flash

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev:web     # Frontend on localhost:3000
pnpm dev:server  # Backend on localhost:8787
```

## Environment Variables

### Server (`packages/server`)

```
GEMINI_API_KEY=your_gemini_api_key
DAILY_API_KEY=your_daily_api_key
```

## Deployment

### Server (Cloudflare Workers)

```bash
cd packages/server
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put DAILY_API_KEY
npx wrangler deploy
```

### Frontend (Cloudflare Pages)

```bash
cd apps/web
pnpm build
npx wrangler pages deploy dist --project-name=dejavu
```

## Project Structure

```
dejavu/
├── apps/
│   ├── web/          # SolidJS frontend
│   └── docs/         # Vocs documentation
├── packages/
│   ├── server/       # Cloudflare Workers backend
│   └── shared/       # Shared types and constants
```

## Links

- **Play**: https://dejavu.enio.la
- **API**: https://dejavu-api.enio.la

## License

MIT
