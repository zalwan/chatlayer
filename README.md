# ChatLayer

**The open-source layer for AI chatbots. Bring your own AI. We handle the chat.**

An open-source, provider-agnostic SDK for building modern AI chat interfaces with streaming, headless state management, and an extensible chat protocol.

```
Build AI chat interfaces without building chat infrastructure.

✓ Provider agnostic  ✓ Streaming-first  ✓ Headless  ✓ TypeScript  ✓ Self-hosted  ✓ Open protocol
```

> **You bring the AI. ChatLayer handles the conversation.**

---

## Packages

| Package             | Version | Description                                                                       |
| ------------------- | ------- | --------------------------------------------------------------------------------- |
| `@chatlayer/core`   | 0.1.0   | Headless `createChat`, `ChatTransport`, NDJSON protocol, Svelte-compatible stores |
| `@chatlayer/svelte` | 0.1.0   | `<ChatWidget>`, `MessageList`, `Message`, `Composer`, Markdown + code blocks      |

Future: `@chatlayer/react` / `@chatlayer/vue` / `@chatlayer/web` — only when Core API stabilises and there is real demand (PRD §32).

## Installation

```bash
pnpm add @chatlayer/svelte
# or npm / yarn / bun
```

Requires `svelte ^5`, `node >=20`.

## Quick start — `<ChatWidget>`

```svelte
<script>
  import { ChatWidget } from "@chatlayer/svelte";
</script>

<ChatWidget endpoint="/api/chat" />
```

Props: `endpoint` **or** `transport`, `theme="light"|"dark"|"system"`, `placeholder`, `title`. Re-exports `createChat`, `HttpTransport`, and all core types so you only need one dependency.

**Backend stays yours** — keys, model, persona, guardrails, RAG, rate limiting live in your `POST /api/chat` (see `PROTOCOL.md`).

## Headless usage

```ts
import { createChat, HttpTransport } from "@chatlayer/svelte";
// or from "@chatlayer/core"

const chat = createChat({ transport: new HttpTransport("/api/chat") });

chat.messages.subscribe((m) => console.log(m));
chat.status.subscribe((s) => console.log(s)); // idle | submitted | streaming | error
chat.error.subscribe((e) => e && console.error(e.code, e.message));

await chat.send("Hello");
chat.stop(); // abort
await chat.retry(); // drop trailing assistant + re-run
await chat.regenerate();
chat.clear();
```

Custom UI:

```svelte
{#each $chat.messages as message (message.id)}
  <CustomMessage {message} />
{/each}
{#if $chat.status === "streaming"}<LoadingIndicator />{/if}
{#if $chat.error}<ErrorMessage {chat} />{/if}
```

## Custom backend

```ts
// SvelteKit example: src/routes/api/chat/+server.ts
import type { ChatRequest, ChatEvent } from "@chatlayer/core";

export async function POST({ request }) {
  const body: ChatRequest = await request.json();
  // validate body.messages, apply system instructions / persona / guardrails,
  // call OpenAI / Anthropic / Ollama / your model, then:
  return new Response(streamChatEvents(modelStream), {
    headers: { "Content-Type": "application/x-ndjson", "X-ChatLayer-Protocol": "1" },
  });
}

function streamChatEvents(source: AsyncIterable<string>): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const id = `msg_${crypto.randomUUID()}`;
      controller.enqueue(
        enc.encode(
          JSON.stringify({ type: "message.start", messageId: id, role: "assistant" }) + "\n",
        ),
      );
      for await (const chunk of source) {
        controller.enqueue(
          enc.encode(JSON.stringify({ type: "message.delta", messageId: id, text: chunk }) + "\n"),
        );
      }
      controller.enqueue(enc.encode(JSON.stringify({ type: "message.end", messageId: id }) + "\n"));
      controller.close();
    },
  });
}
```

Any provider works — the frontend never sees API keys. See `PROTOCOL.md` for the full wire spec and fixtures in `fixtures/*.jsonl` (e.g. `fixtures/streaming.jsonl`).

## Transport API

```ts
import type { ChatTransport, ChatRequest, ChatRequestOptions, ChatEvent } from "@chatlayer/core";

const transport: ChatTransport = {
  async *send(req: ChatRequest, opts?: ChatRequestOptions): AsyncIterable<ChatEvent> {
    // yield { type: "message.start", messageId, role } ...
  },
};
```

`HttpTransport` (`packages/core/src/http-transport.ts:29`) does `POST` JSON + `Accept: application/x-ndjson` + `X-ChatLayer-Protocol: 1`, parses NDJSON via `parseNdjsonStream` (`packages/core/src/parse.ts:77`), honours `AbortSignal`.

## Protocol

Spec: [`PROTOCOL.md`](./PROTOCOL.md). Types: `packages/core/src/types.ts:83`, version at `packages/core/src/version.ts:10`. Events: `message.start` → `message.delta`* → `message.end`, plus `error`. Unknown types are ignored for forward compatibility.

## Scripts

```bash
pnpm install
pnpm test        # vitest, 54 tests (core + svelte) — now green
pnpm typecheck
pnpm build
pnpm format
```

## Security

No API keys in the browser, no telemetry, no hidden network requests. Backend is the authority for auth, policy, and data. See `SECURITY.md`.

## License

Apache-2.0 — see `LICENSE`. Copyright 2026 ChatLayer Contributors.
