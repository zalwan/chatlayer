# ChatLayer Protocol — v1

> Transport-agnostic, provider-agnostic event protocol between **application backend → ChatLayer runtime**. `packages/core/src/types.ts:83` is the source of truth; this document is the human spec.

- **Protocol version:** `1` (`X-ChatLayer-Protocol: 1`, `packages/core/src/version.ts:10`)
- **Wire format (HTTP transport):** NDJSON (`application/x-ndjson`) — one JSON object per line, `packages/core/src/parse.ts:77`
- **Transport:** any `ChatTransport` (`packages/core/src/transport.ts:21`). MVP ships `HttpTransport` (`packages/core/src/http-transport.ts:29`).

---

## 1. ChatRequest

Client → backend JSON body (`POST`):

```json
{
  "messages": [
    {
      "id": "user_abc",
      "role": "user",
      "content": [{ "type": "text", "text": "Hi" }],
      "createdAt": "2026-09-09T00:00:00.000Z"
    }
  ],
  "sessionId": "optional-correlation-id",
  "metadata": { "any": "app fields — never trusted as AI policy" }
}
```

Type: `ChatRequest` at `packages/core/src/types.ts:33`. Backend **must** validate/filter; client-supplied `messages`/`system` are not trusted for persona, instructions, guardrails, or keys (PRD §13–14).

## 2. ChatMessage / ChatContent

```ts
type ChatRole = "user" | "assistant" | "system";
interface ChatMessage {
  id: string;
  role: ChatRole;
  content: ChatContent[];
  createdAt?: string;
}
type ChatContent = TextContent;
interface TextContent {
  type: "text";
  text: string;
}
```

MVP only `text`. Content is a discriminated union so future `image`/`file`/`tool`/`citation`/`custom` can be added without breaking `packages/core/src/types.ts:17`.

## 3. ChatStatus

```ts
type ChatStatus = "idle" | "submitted" | "streaming" | "error";
```

Machine in `packages/core/src/create-chat.ts:62` : `idle → submitted → streaming → idle` (success) or `→ error` (failure). `stop()` returns to `idle` with no error.

## 4. Events

Union `ChatEvent` at `packages/core/src/types.ts:83`:

### 4.1 `message.start`

```json
{ "type": "message.start", "messageId": "msg_123", "role": "assistant" }
```

Creates the assistant placeholder and moves status to `streaming` (`packages/core/src/create-chat.ts:128`).

### 4.2 `message.delta`

```json
{ "type": "message.delta", "messageId": "msg_123", "text": "Hello" }
```

Appended to that message (`packages/core/src/create-chat.ts:138`). Many deltas per message. If no prior `message.start`, runtime creates the message (`packages/core/src/create-chat.ts:236`).

### 4.3 `message.end`

```json
{ "type": "message.end", "messageId": "msg_123" }
```

No-op — message already materialised; stream may end without it.

### 4.4 `error`

```json
{ "type": "error", "code": "MODEL_ERROR", "message": "Model temporarily unavailable" }
```

Throws `ChatError` → `status="error"`, `error` store set (`packages/core/src/create-chat.ts:145`). Also synthesised by `HttpTransport` for non-2xx (`packages/core/src/http-transport.ts:90`).

### Forward compatibility

Unknown `type` values are ignored (`packages/core/src/parse.ts:42`). Future events (`tool.start`/`tool.delta`/`tool.end`, `citation`, `attachment`, `status`, `custom`) must be added as optional branches without breaking v1 clients (PRD §18).

## 5. Error codes

Stable codes at `packages/core/src/transport.ts:26`:

| code              | meaning                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `MODEL_ERROR`     | provider/model failure                                               |
| `TRANSPORT_ERROR` | cannot reach endpoint / network                                      |
| `ABORTED`         | user `stop()` — **not** surfaced as `error` state                    |
| `BAD_REQUEST`     | 4xx (from `extractError`, `packages/core/src/http-transport.ts:106`) |
| `SERVER_ERROR`    | 5xx                                                                  |
| `PARSE_ERROR`     | reserved                                                             |

`ChatError.aborted` (`packages/core/src/transport.ts:52`) and `isAbortError` treat native `AbortError` the same as `ABORTED`.

## 6. Wire — HTTP NDJSON

Request headers (`packages/core/src/http-transport.ts:44`):

```
Content-Type: application/json
Accept: application/x-ndjson
X-ChatLayer-Protocol: 1
```

Response body: UTF-8 NDJSON stream, `\n`-delimited. `parseNdjsonStream` (`packages/core/src/parse.ts:77`) decodes incrementally, yields only valid events, ignores empty/bad lines and unknown types, honours `AbortSignal`. On non-2xx it tries to parse an `error` event line before synthesising an HTTP error (`packages/core/src/http-transport.ts:69`).

Fixtures in `fixtures/*.jsonl` are canonical examples.

## 7. Versioning

- Bump `PROTOCOL_VERSION` for breaking wire/event schema changes.
- Clients send header; backends may negotiate / reject unknown versions.
- Additive event types do **not** bump major — clients ignore unknowns.
- Keep `ChatEvent` discriminated and `parseChatEvent` lenient (PRD §32 Phase 0).

## 8. Security boundary

Backend owns API keys, system prompt, persona, guardrails, RAG, rate limiting, persistence. Never accept them from `ChatRequest`. No telemetry or hidden requests from Core.
