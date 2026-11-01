# CampusGPT

> AI assistant for University of Ghana students — powered by Groq (GPT-OSS and Qwen).

CampusGPT is a full-stack, production-ready AI campus assistant. Students can ask about course registration, portals, halls, SLTF loans, academic policies, and get live step-by-step walking directions around Legon campus via **Walk With Me** mode.

---

## Features

| Feature | Description |
|---|---|
| **AI Chat** | Streaming answers from GPT-OSS 120B (default) or GPT-OSS 20B (fast replies) |
| **Smart Model Routing** | Automatically detects complex questions and switches to the reasoning model |
| **Walk With Me** | Voice-activated campus navigation with step-by-step Legon directions |
| **Voice Mode** | Full speech-to-text + text-to-speech conversation overlay |
| **Documents Library** | Upload and manage PDFs, Word docs, lecture slides |
| **Academic Planner** | Schedule and task management for UG students |
| **Timetable** | Weekly class timetable view |
| **Notifications** | Campus alerts and deadline reminders |
| **Dark Mode** | Full light/dark theme support |
| **Mobile-first** | Responsive layout optimised for phones and tablets |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS v4 |
| **Backend** | Express 5, Node.js 24, TypeScript |
| **Database** | PostgreSQL + Drizzle ORM |
| **AI** | Groq SDK — GPT-OSS 120B / 20B, Qwen 3.6 27B (vision), Whisper (STT), Orpheus (TTS) |
| **API Contract** | OpenAPI 3 spec + Orval codegen (React Query hooks + Zod schemas) |
| **Monorepo** | pnpm workspaces |
| **Auth** | Better Auth — verified student email, optional Microsoft/Google |

---

## Repository Structure

```
/
├── artifacts/
│   ├── api-server/          # Express 5 API backend
│   │   └── src/
│   │       ├── routes/      # chat, threads, documents, planner, timetable, user…
│   │       ├── lib/         # knowledgeBase.ts (UG KB + Walk With Me prompt)
│   │       └── index.ts     # Server entry point
│   │
│   └── campus-gpt/          # React + Vite frontend
│       └── src/
│           ├── components/
│           │   ├── chat/    # ChatThread, Composer, ActionSheet, ThinkingIndicator…
│           │   ├── voice/   # VoiceCallModal
│           │   ├── layout/  # Sidebar, AppShell, MobileNav
│           │   └── ui/      # Shared shadcn-style primitives
│           ├── hooks/       # useChat, useVoiceChat, useAppStore…
│           ├── pages/       # Chat, Home, Documents, Planner, Timetable, Settings…
│           └── store/       # Zustand global store
│
├── lib/
│   ├── db/                  # Drizzle schema + migrations
│   └── api-client-react/    # Generated React Query hooks (from OpenAPI)
│
├── scripts/                 # Utility scripts
└── pnpm-workspace.yaml      # Workspace config + catalog pins
```

---

## Prerequisites

- **Node.js** 24 and **pnpm** 10 (`npm i -g pnpm`)
- **Docker** (easiest way to get PostgreSQL), or your own PostgreSQL 14+
- **Groq API key** (free at [console.groq.com](https://console.groq.com)) for chat and voice. The app boots without it; AI endpoints return a clear 503.

No Google/Maps key or cloud account is needed to run locally.

---

## Run locally

```bash
git clone https://github.com/richid-stack/CampusGPT campusgpt
cd campusgpt
pnpm install
cp .env.example .env        # add your GROQ_API_KEY
docker compose up -d db     # PostgreSQL on :5432
pnpm db:push                # create tables
pnpm dev                    # API on :8080, web on http://localhost:5173
```

The Vite dev server proxies `/api` to the API, so there is nothing else to configure.

## Sign-in

Accounts are restricted to student email addresses (`ALLOWED_EMAIL_DOMAINS`, default `st.ug.edu.gh`). Students sign up with their student email and open the verification link we send to it, which proves they own the mailbox. Microsoft and Google buttons appear automatically when their keys are set (see `.env.example`).

- **Locally:** `docker compose up -d db mailpit` and read verification emails at http://localhost:8025. With no `SMTP_URL`, development prints the link in the API log instead.
- **Production:** set `BETTER_AUTH_SECRET` (`openssl rand -base64 32`), `BETTER_AUTH_URL` (your public URL) and `SMTP_URL` (any SMTP provider). The server refuses to start without them.
- **Microsoft sign-in:** register an app in the Microsoft Entra admin center with redirect URI `<BETTER_AUTH_URL>/api/auth/callback/microsoft`. Set `MICROSOFT_TENANT_ID` to your university's tenant to accept only its accounts. Your university's IT may need to approve the app.
- Each user's chats, documents, planner, timetable, notifications and profile are private to them. Rows created before accounts existed have no owner and are hidden.

## Run everything in Docker

```bash
cp .env.example .env        # add your GROQ_API_KEY
docker compose up --build   # app on http://localhost:8080
```

This builds one image that serves the API and the built frontend from a single origin, creates the tables, and starts PostgreSQL.

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm install` | Install all workspace dependencies |
| `pnpm dev` | Run API (8080) and web (5173) together |
| `pnpm db:push` | Apply the Drizzle schema to `DATABASE_URL` |
| `pnpm run typecheck` | Full TypeScript check across all packages |
| `pnpm run build` | Build all packages |
| `pnpm --filter @workspace/api-server run dev` | Start API server in dev mode (hot reload) |
| `pnpm --filter @workspace/campus-gpt run dev` | Start Vite dev server |
| `pnpm --filter @workspace/db run push` | Push DB schema changes (dev only) |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API hooks from OpenAPI spec |

---

## AI Models

| Mode | Model | Used when |
|---|---|---|
| Default | `openai/gpt-oss-120b` | General and complex questions |
| Fast | `openai/gpt-oss-20b` | Quick replies, voice mode |
| Vision | `qwen/qwen3.6-27b` | Image understanding |

Model routing is automatic (see `selectModel()` in `artifacts/api-server/src/routes/chat.ts`). You can extend `selectModel()` in `artifacts/api-server/src/routes/chat.ts`.

---

## Key Files to Edit

| File | What it controls |
|---|---|
| `artifacts/api-server/src/lib/knowledgeBase.ts` | UG knowledge base text + Walk With Me prompt |
| `artifacts/api-server/src/routes/chat.ts` | AI model selection, streaming, think-block filtering |
| `artifacts/campus-gpt/src/components/chat/Composer.tsx` | Composer bar (input, send, voice, +) |
| `artifacts/campus-gpt/src/components/chat/ActionSheet.tsx` | The "+" action sheet (6 options) |
| `artifacts/campus-gpt/src/components/chat/ThinkingIndicator.tsx` | Sequential thinking status chips |
| `artifacts/campus-gpt/src/components/voice/VoiceCallModal.tsx` | Voice overlay with transcript |
| `artifacts/campus-gpt/src/hooks/useChat.ts` | Chat streaming logic |
| `artifacts/campus-gpt/src/hooks/useVoiceChat.ts` | STT + TTS + AI voice loop |
| `artifacts/campus-gpt/src/index.css` | Tailwind theme (brand colors, dark mode) |

---

## Adding to the Knowledge Base

Edit `artifacts/api-server/src/lib/knowledgeBase.ts`:

```ts
export const KNOWLEDGE_BASE = `
## Your new section
- Fact one
- Fact two
`;
```

The text is injected into the system prompt verbatim. Keep it under 6,000 tokens for best performance.

---

## Extending the API

1. Add a route file in `artifacts/api-server/src/routes/`
2. Register it in `artifacts/api-server/src/routes/index.ts`
3. Add the endpoint to `lib/api-spec/openapi.yaml`
4. Run `pnpm --filter @workspace/api-spec run codegen` to regenerate React Query hooks

---

## Voice Mode Notes

Voice uses the browser **Web Speech API**:
- Speech-to-text: `SpeechRecognition` (Chrome only)
- Text-to-speech: `SpeechSynthesis` (all modern browsers)
- Set `recognition.lang = 'en-GH'` for Ghanaian English accent

To change the language, edit `artifacts/campus-gpt/src/hooks/useVoiceChat.ts`.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `GROQ_API_KEY` | Yes | Groq API key (get at console.groq.com) |
| `BETTER_AUTH_SECRET` | Prod | Session signing secret, 32+ chars |
| `BETTER_AUTH_URL` | Prod | Public site URL (used in email links and OAuth callbacks) |
| `SMTP_URL` | Prod | SMTP connection URL for verification and reset emails |
| `ALLOWED_EMAIL_DOMAINS` | No | Comma-separated email domains allowed to sign up (empty = anyone) |
| `CORS_ORIGINS` | Prod | Comma-separated allowed browser origins (cross-origin disabled in production if unset) |
| `PORT` | No | API server port (default: 5000) |
| `NODE_ENV` | No | Set to `production` for production builds |

---

## Deployment

The app is structured for deployment on **Replit** with:
- API server behind `/api` path
- Frontend served at `/`
- PostgreSQL managed by Replit

For custom deployment (VPS, Railway, Render, etc.):
1. Build the frontend: `pnpm --filter @workspace/campus-gpt run build`
2. Serve the `dist/` folder from the API server (or a CDN)
3. Set all environment variables
4. Run `pnpm --filter @workspace/db run push` once against production DB

---

## License

MIT — University of Ghana student project. Built with care for the Legon campus community.
