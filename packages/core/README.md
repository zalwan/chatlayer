# @zalwan/chatlayer

[![npm](https://img.shields.io/npm/v/@zalwan/chatlayer?color=0f172a)](https://www.npmjs.com/package/@zalwan/chatlayer) [![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](../../LICENSE)

Headless, provider-agnostic chat runtime for **ChatLayer** — the open-source layer for AI chatbots.

- `createChat()` + Svelte-compatible stores (`messages`, `status`, `error`)
- Streaming-first NDJSON protocol (`message.start` → `message.delta` → `message.end` → `error`)
- `HttpTransport` + `parseNdjsonStream`, `AbortSignal`, `retry`/`regenerate`/`stop`
- TypeScript, zero UI, bring your own AI

```ts
import { createChat, HttpTransport } from "@zalwan/chatlayer";

const chat = createChat({ transport: new HttpTransport("/api/chat") });
chat.messages.subscribe(console.log);
await chat.send("Hello");
```

See root [README](../../README.md) and [PROTOCOL](../../PROTOCOL.md). Svelte UI lives in `@zalwan/chatlayer-svelte`.
