# @zalwan/example-sveltekit

Minimal SvelteKit app proving **< 5 min** integration (`PRD.md:164`):

```svelte
<ChatWidget endpoint="/api/chat" />
```

## Run

```bash
pnpm install
pnpm --filter @zalwan/example-sveltekit dev   # http://localhost:5173
# or from this folder: pnpm dev
```

## Backends

| Endpoint           | Provider                  | Needs                                                                           |
| ------------------ | ------------------------- | ------------------------------------------------------------------------------- |
| `/api/chat`        | Mock streaming            | nothing — default                                                               |
| `/api/chat-openai` | OpenAI (`gpt-4o-mini`)    | `OPENAI_API_KEY`, optional `OPENAI_MODEL`                                       |
| `/api/chat-ollama` | Ollama local (`llama3.1`) | `ollama serve` + `ollama pull llama3.1`, optional `OLLAMA_URL` / `OLLAMA_MODEL` |

```bash
OPENAI_API_KEY=sk-... pnpm dev          # OpenAI tab works
OLLAMA_URL=http://localhost:11434 pnpm dev  # Ollama tab works
```

Shared converter lives in `src/lib/server/chat-events.ts` — frontend stays identical, only the handler knows the provider.

## What to look at

- `src/routes/+page.svelte` — widget + headless snippet.
- `src/routes/api/chat/+server.ts` — mock NDJSON backend. Replace `mockReply` with your real `OpenAI / Anthropic / Ollama` call and keep the same `message.start` → `message.delta`* → `message.end` envelope (`PROTOCOL.md` §4, `fixtures/streaming.jsonl`).
- Type `error` in the chat to see `MODEL_ERROR` → Retry flow.

Backend owns keys, persona, and guardrails — never send them from the client.
