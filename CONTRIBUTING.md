# Contributing to ChatLayer

Thank you for considering contributing to **ChatLayer** — the open-source layer for AI chatbots. This guide makes it easy to get started, whether you fix a typo, add a test, or ship a new transport.

> **You don't need to be an AI expert.** ChatLayer is a conversation-interface layer, not a model. If you can build UI or a small backend, you can contribute.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Ways to Contribute](#ways-to-contribute)
3. [Prerequisites](#prerequisites)
4. [Getting Started (5 minutes)](#getting-started-5-minutes)
5. [Project Structure](#project-structure)
6. [Development Workflow](#development-workflow)
7. [Scripts](#scripts)
8. [Conventions](#conventions)
9. [Testing](#testing)
10. [Protocol & Type Changes](#protocol--type-changes)
11. [UI Contributions](#ui-contributions)
12. [Documentation](#documentation)
13. [Pull Request Checklist](#pull-request-checklist)
14. [Branching & Releases](#branching--releases)
15. [Reporting Issues](#reporting-issues)
16. [Getting Help](#getting-help)

---

## Code of Conduct

This project follows [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) (Contributor Covenant). Be kind, be respectful, assume good intent. Violations can be reported via GitHub private advisory or `security@chatlayer.example`.

---

## Ways to Contribute

| Area                | Examples                                                                       | Good for           |
| ------------------- | ------------------------------------------------------------------------------ | ------------------ |
| **Frontend**        | polish `Composer.svelte`, a11y, theming, animations, `MessageList` auto-scroll | Svelte / CSS folks |
| **Core / Protocol** | new `ChatTransport`, NDJSON edge cases, `createChat` state machine             | Backend / TS folks |
| **Examples**        | add `examples/sveltekit` variant, vanilla HTML, Laravel/Django backend sample  | Full-stack         |
| **Docs**            | fix `README.md`, `PROTOCOL.md`, recipes, tutorials                             | Writers            |
| **Tests**           | add `vitest` cases for retry/abort, fixtures in `fixtures/*.jsonl`             | QA                 |
| **Infra**           | CI, `pnpm` workspace, `svelte-check`                                           | DevOps             |

You don't need to pick a big feature — small PRs are welcome.

---

## Prerequisites

- **Node.js** `>=20` (CI tests `20` + `22`). Use `nvm`/`fnm` if you juggle versions.
- **pnpm** `>=9.12` (see `packageManager` in `package.json`). Corepack works: `corepack enable`.
- **Git** + a GitHub account.

Verify:

```bash
node -v   # >=20
pnpm -v   # 9.12.x
```

---

## Getting Started (5 minutes)

```bash
# 1. Fork on GitHub, then clone your fork
git clone https://github.com/<you>/chatlayer.git
cd chatlayer

# 2. Install (workspace: root + packages/core + packages/svelte + examples/sveltekit)
pnpm install

# 3. Build both packages (generates dist + .d.ts)
pnpm build

# 4. Run checks — should be green
pnpm format:check
pnpm typecheck
pnpm test

# 5. Try the example
pnpm dev
# → http://localhost:5173  — ChatWidget → /api/chat mock streaming
# Type "error" to see MODEL_ERROR → Retry flow
```

If `pnpm typecheck` fails on a fresh clone without `dist`, it still passes now — `packages/svelte/tsconfig.json` has a `paths` alias to `../core/src/index.ts` as fallback. Still, `pnpm build` first is recommended.

**Local integration test (Zal-style):**
If you have a SvelteKit app nearby (e.g. `../porot/zal`), the example already proves the integration. For your own app:

```ts
// vite.config.ts — alias to local ChatLayer source while developing
import { fileURLToPath } from "node:url";
const core = fileURLToPath(new URL("../chatlayer/packages/core/src/index.ts", import.meta.url));
export default { resolve: { alias: { "@zalwan/chatlayer": core } } };
```

---

## Project Structure

```
chatlayer/
├── packages/
│   ├── core/                 # @zalwan/chatlayer — headless runtime
│   │   ├── src/
│   │   │   ├── create-chat.ts   # state machine idle→submitted→streaming→idle|error
│   │   │   ├── http-transport.ts# POST JSON + Accept: application/x-ndjson + X-ChatLayer-Protocol:1
│   │   │   ├── parse.ts         # parseNdjsonStream, lenient + ignore unknown types
│   │   │   ├── transport.ts     # ChatTransport interface + ChatError
│   │   │   ├── types.ts         # ChatMessage, ChatRequest, ChatEvent (source of truth)
│   │   │   ├── store.ts         # Svelte-compatible writable/readable
│   │   │   └── version.ts       # PROTOCOL_VERSION = "1"
│   │   └── tests/               # vitest: store, parse, http-transport, create-chat, state-machine
│   └── svelte/               # @zalwan/chatlayer-svelte — Svelte 5 UI
│       ├── src/lib/
│       │   ├── ChatWidget.svelte  # entry, header glass + theme, composes below
│       │   ├── MessageList.svelte # auto-scroll, empty state ✦, LoadingIndicator
│       │   ├── Message.svelte     # bubble 20px, cl-msg-in 0.38s, markdown via Markdown.svelte
│       │   ├── Composer.svelte    # pill field, auto-resize, send/stop icons
│       │   ├── LoadingIndicator.svelte # typing bubble dots
│       │   ├── ErrorMessage.svelte     # retry pill
│       │   ├── Markdown.svelte         # marked + DOMPurify, SSR-safe
│       │   └── theme.ts                # light/dark/system via themeStore + matchMedia
│       └── tests/               # ChatWidget, Composer, Message
├── examples/
│   └── sveltekit/            # minimal SvelteKit proving <5 min integration
│       ├── src/routes/+page.svelte
│       └── src/routes/api/chat/+server.ts # mock NDJSON streaming, replace with OpenAI/Anthropic
├── fixtures/                 # canonical NDJSON: basic-chat, streaming, error, tool-events
├── PROTOCOL.md               # human spec — keep in sync with packages/core/src/types.ts:83
├── PRD.md                     # product direction (Indonesian + English)
├── SECURITY.md
└── .github/workflows/
    ├── ci.yml                # pnpm install → build → format:check → typecheck → test
    └── publish.yml           # tag v* → OIDC provenance publish to npm
```

**Key principle:** `PROTOCOL.md` is human-readable, `packages/core/src/types.ts` is the source of truth. Change types first, then docs.

---

## Development Workflow

### 1. Create a branch

```bash
git checkout -b feat/your-feature   # or fix/bug-name, docs/..., chore/...
```

Branch naming: `feat/`, `fix/`, `docs/`, `chore/`, `refactor/` + kebab-case.

### 2. Make changes

- **Core:** edit `packages/core/src/*.ts` → keep `src/types.ts` discriminated union extensible.
- **UI:** edit `packages/svelte/src/lib/*.svelte` → keep `prefers-reduced-motion` support, keep `data-role` and class names stable (tests rely on them).
- **Examples/fixtures:** keep `fixtures/*.jsonl` as canonical wire examples.

### 3. Format, typecheck, test, build (before pushing)

```bash
pnpm format          # prettier --write . (includes svelte plugin)
pnpm build           # tsup + svelte-package
pnpm typecheck       # tsc --noEmit + svelte-check
pnpm test            # vitest 54 tests (45 core + 9 svelte)
```

CI runs in this order: `install → build → format:check → typecheck → test`. `build` before `typecheck` so `dist` exists for `svelte-check` on clean clones.

### 4. Commit

Conventional Commits are encouraged (not enforced by hook):

```
feat(core): add WebSocket transport
fix(svelte): Composer auto-resize on paste
docs(protocol): clarify error.code stability
style: prettier 7 files
chore: bump 0.1.2 -> 0.1.3
```

Keep commits scoped and small. Squash is fine.

### 5. Push & open PR

```bash
git push -u origin feat/your-feature
# open PR on GitHub → fill template → link issue if any
```

---

## Scripts

| Command             | What it does                                                        |
| ------------------- | ------------------------------------------------------------------- |
| `pnpm install`      | install workspace deps (root + packages)                            |
| `pnpm dev`          | `vite dev` in `examples/sveltekit`                                  |
| `pnpm build`        | `pnpm -r --filter=./packages/* build` → `core/dist` + `svelte/dist` |
| `pnpm typecheck`    | `core: tsc --noEmit` + `svelte: svelte-check`                       |
| `pnpm test`         | `vitest run` (45 core + 9 svelte)                                   |
| `pnpm format`       | `prettier --write .`                                                |
| `pnpm format:check` | `prettier --check .` (CI)                                           |
| `pnpm clean`        | `rm -rf dist .svelte-kit node_modules/.cache` in packages           |

Run from repo root. To run a single package: `pnpm --filter @zalwan/chatlayer test`.

---

## Conventions

- **TypeScript `strict: true`** (`tsconfig.base.json`). No `any` without justification. The `Message.svelte` fix `filter((part: ChatContent) => ...)` is the pattern for discriminated unions.
- **No Svelte warnings** — `state_referenced_locally` warnings remain in 3 files (`Composer`, `ErrorMessage`, `MessageList`) — they are intentional (reading `chat` stores outside effect). Don't add new ones.
- **CSS:** prefer `color-mix`, `oklch`, `var(--cl-*)` tokens. Always guard animations with `@media (prefers-reduced-motion: reduce) { animation: none }`.
- **Imports:** use `@zalwan/chatlayer` (core) and `@zalwan/chatlayer-svelte` (UI). The `@chatlayer/core` alias remains in `tsconfig.json` for back-compat, but new code should use `@zalwan/*`.
- **No secrets in client** — `SECURITY.md` is the rule. `ChatRequest` is never trusted for persona/keys.

---

## Testing

- **Core:** `packages/core/tests/*.test.ts` — stores, parsing, state machine, `createChat`. Run `pnpm --filter @zalwan/chatlayer test:watch` for TDD.
- **Svelte:** `packages/svelte/tests/*.test.ts` — `ChatWidget` streams `message.start/delta/end`, error→retry, `Composer` disabled state, `Message` markdown. Uses `@testing-library/svelte` + `jsdom`.
- **Fixtures:** `fixtures/*.jsonl` are the wire truth. If you change `ChatEvent`, update fixtures and `PROTOCOL.md`.
- **Manual:** `pnpm dev` → type `"error"` to trigger `MODEL_ERROR` branch in `examples/sveltekit/src/routes/api/chat/+server.ts`.

Add tests for new behavior. Keep `pnpm test` under 2s.

---

## Protocol & Type Changes

1. Edit `packages/core/src/types.ts` (source of truth) + `packages/core/src/version.ts` if breaking wire.
2. Update `packages/core/src/parse.ts` (`parseChatEvent`, `parseNdjsonStream`) — keep lenient: ignore unknown `type`, skip malformed lines.
3. Update `PROTOCOL.md` §4 (`ChatEvent` union) and §7 versioning notes.
4. Update `fixtures/*.jsonl` and `packages/core/tests/parse.test.ts`.
5. Consider `X-ChatLayer-Protocol` header bump — backends must negotiate.

Additive events (`tool.start`, `citation`, etc.) do **not** bump major; clients ignore unknown `type` (`PRD §18`, `PROTOCOL.md` forward compatibility).

---

## UI Contributions

- Keep `ChatWidget.svelte` header, `Message.svelte` bubble, `Composer.svelte` pill, `LoadingIndicator` typing bubble styles as in `0.1.3` — modern glass + 20px radii + `cl-msg-in` / `cl-typing` / `cl-presence-pulse` animations.
- Test a11y: `aria-label`, `role="dialog"`, `Escape` to close, focus-visible rings.
- Test both themes: `theme="light"|"dark"|"system"`. Verify `matchMedia` listener teardown in `theme.ts`.
- Keep `vite.config.ts` alias for `vitest` (`resolve.alias` + `conditions: ["browser"]`).

---

## Documentation

- Root `README.md` is the 30-second pitch + install + quick start. Keep it under 160 lines.
- Per-package `packages/core/README.md` and `packages/svelte/README.md` are what npm shows — keep them concise with install + 1 snippet.
- `PROTOCOL.md` mirrors `types.ts`. If you change the protocol, docs must change in same PR.

---

## Pull Request Checklist

Before marking ready:

- [ ] `pnpm format` run (CI checks `format:check`)
- [ ] `pnpm build` succeeds
- [ ] `pnpm typecheck` → `0 errors` (3 warnings in svelte allowed)
- [ ] `pnpm test` → `54 passed`
- [ ] `fixtures` / `PROTOCOL.md` updated if protocol changed
- [ ] `CHANGELOG.md` updated — add entry to `Unreleased` (`Added`/`Changed`/`Fixed`) for every behavior/API/UI/docs change
- [ ] `README.md` Packages table version updated if `packages/*/package.json` version bumped
- [ ] No new `svelte-check` warnings
- [ ] Commit messages are descriptive (Conventional Commits encouraged)
- [ ] PR description explains _why_, not just _what_, and links issue

Smaller PRs review faster. If your change is >300 lines, consider splitting.

> **Changelog is mandatory.** Every PR that changes behavior, API, UI, or docs must touch `CHANGELOG.md`. Fixes that are docs-only with no version bump still go to `Unreleased`. CI will remind you if `CHANGELOG.md` is untouched.

---

## Branching & Releases

- **Main branch:** `main` is the source of truth. CI runs on `push` to `main`/`master` and PRs.
- **Versioning:** SemVer. `0.1.x` is pre-stable; breaking changes bump minor. **Keep `README.md` Packages table in sync** — after `npm version` bump, update `| Version |` to the new version (badges are dynamic via `shields.io`, table is static for quick scan).
- **Changelog:** `CHANGELOG.md` follows Keep a Changelog. Every release moves `Unreleased` entries to a new `## [x.y.z] - YYYY-MM-DD` section. Compare links at bottom auto-generate diffs. Never edit past releases — only `Unreleased` and the new version heading.
- **Local publish (maintainers):** `pnpm --filter @zalwan/chatlayer publish --access public` (needs granular `NPM_TOKEN` with bypass 2FA in `~/.npmrc`).
- **OIDC publish (recommended):** `git tag v0.1.x && git push origin v0.1.x` → `.github/workflows/publish.yml` does `build→typecheck→test→publish --provenance` with `secrets.NPM_TOKEN` (id-token: write). This gives npm provenance attestations (sig `SHA256:DhQ8w...`). Tag version must match `packages/*/package.json` version.
- **Never force-push `main`** or publish same version twice. Verify with `npm view @zalwan/chatlayer version` vs `README.md` table vs `CHANGELOG.md` latest heading.

---

## Reporting Issues

Use GitHub Issues:

- **Bug:** minimal reproduction, expected vs actual, `node -v` / `pnpm -v`, `svelte` version, browser.
- **Feature:** describe the chat behavior problem, not just the API you want. PRD §41 philosophy questions help: "Does it solve a real chat interface problem? Does it keep ChatLayer small?"
- **Security:** see `SECURITY.md` — report privately via email or GitHub private advisory, not public issue.

---

## Getting Help

- **Discussions:** GitHub Discussions (or open a draft PR with `WIP:`).
- **Example:** `examples/sveltekit` is the fastest way to reproduce an issue — copy its `+server.ts` mock to isolate protocol vs UI.
- **PG?** If you're stuck, open an issue with label `help wanted` — maintainers aim to respond within 3 business days.

Thank you for making ChatLayer more reliable, faster, and easier to use. — _You bring the AI. We handle the chat._
