# Security Policy

## Principles

ChatLayer is a **conversation interface layer** — not an AI provider, auth system, or data store (PRD §9, §35).

- **No API keys in the client.** Model credentials never leave the backend. `ChatRequest` (`packages/core/src/types.ts:33`) must not be trusted for persona, system instructions, guardrails, or keys.
- **No telemetry by default.** Core and Svelte packages make no hidden network requests. Only the configured `endpoint`/`transport` is contacted (`packages/core/src/http-transport.ts:29`).
- **No hidden persistence.** Conversation storage (SQLite, Postgres, Redis, localStorage, …) is the application's responsibility.

Backend remains responsible for authentication, authorization, input validation, rate limiting, system prompt, persona, guardrails, RAG, and memory (PRD §35–36).

## Reporting a vulnerability

Please report security issues privately — do not open a public issue.

- Email: `security@chatlayer.example` (replace with your contact before publish)
- Or: GitHub private security advisory on this repository

Include a minimal reproduction, affected versions, and impact. We aim to acknowledge within 3 business days and to ship a fix or mitigation as soon as practical.

## Supported versions

| Version | Supported             |
| ------- | --------------------- |
| 0.1.x   | ✅ active development |

## Protocol / transport notes

- HTTP transport sends `X-ChatLayer-Protocol: 1` and `Accept: application/x-ndjson` (`packages/core/src/version.ts:10`, `packages/core/src/http-transport.ts:44`). Validate the header on the backend if you run multiple protocol versions.
- NDJSON parsing is lenient: unknown event `type`s and malformed lines are ignored (`packages/core/src/parse.ts:42`) — do not rely on them for security decisions.
- `extractError` (`packages/core/src/http-transport.ts:90`) surfaces backend `error` events verbatim; backends should sanitize `message` to text safe for UI display.
- DOMPurify sanitization in `packages/svelte/src/lib/Markdown.svelte:17` protects against XSS in assistant markdown; keep `dompurify` and `marked` updated.
