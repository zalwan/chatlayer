# @chatlayer/example-sveltekit

Minimal SvelteKit app proving **< 5 min** integration (`PRD.md:164`):

```svelte
<ChatWidget endpoint="/api/chat" />
```

## Run

```bash
pnpm install
pnpm --filter @chatlayer/example-sveltekit dev   # http://localhost:5173
# or from this folder: pnpm dev
```

## What to look at

- `src/routes/+page.svelte` — widget + headless snippet.
- `src/routes/api/chat/+server.ts` — mock NDJSON backend. Replace `mockReply` with your real `OpenAI / Anthropic / Ollama` call and keep the same `message.start` → `message.delta`* → `message.end` envelope (`PROTOCOL.md` §4, `fixtures/streaming.jsonl`).
- Type `error` in the chat to see `MODEL_ERROR` → Retry flow.

Backend owns keys, persona, and guardrails — never send them from the client.
