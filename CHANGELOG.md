# Changelog

All notable changes to **ChatLayer** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).  
**You must add an entry to `Unreleased` for every PR that changes behavior, API, UI, or docs** (see `CONTRIBUTING.md`).

## [Unreleased]

### Added

- _Add new entries here under `Added` / `Changed` / `Fixed` / `Removed`._

---

## [0.1.5] - 2026-09-09

### Added

- **Layout** `ChatWidget` `layout` prop (`ChatLayout` `inline`|`bubble`|`fullscreen`, default `inline`). `bubble` renders FAB (`cl-fab` pulse `2.6s`, `MessageCircle`/`X` SVG, badge `✦`, sheen) + backdrop `blur(6px)` `fade 220ms` + panel `rounded 24px` `blur 20px` `fly y:14 360ms` with footer `Powered by ChatLayer`. `inline` adds `data-layout` border `24px` `shadow`, `fullscreen` uses `100dvh`. Backwards-compat: default remains `inline` (same as `0.1.4`).

---

## [0.1.4] - 2026-09-09

### Fixed

- **ESM** `ERR_MODULE_NOT_FOUND: Cannot find module .../dist/lib/theme` imported from `dist/index.js` (`zal: [500] GET /`). `packages/svelte/src/index.ts:16` now `from "./lib/theme.js"` so `svelte-package` emits `dist/index.js` with `.js` extension — fixes Node ESM strict resolver (tailwind `esm-cache.loader`) for `@zalwan/chatlayer-svelte` `0.1.3` installed via npm in SvelteKit. Bump `0.1.3 → 0.1.4` for both packages.

---

## [0.1.3] - 2026-09-09

### Changed

- Bump `@zalwan/chatlayer` and `@zalwan/chatlayer-svelte` `0.1.1 → 0.1.3`.

### Fixed

- **Publish** `v0.1.2` workflow failed `secrets.NPM_TOKEN missing` (`publish.yml:34`). Set granular `NPM_TOKEN` (bypass 2FA) in GitHub Secrets and retry with `v0.1.3` — now `completed success` with OIDC provenance (`dist.signatures` `SHA256:DhQ8w...`).

> `v0.1.2` tag exists but was not published to npm (workflow failed before `PUT`). `0.1.3` is the first provenance-published release.

## [0.1.1] - 2026-09-09

### Added

- **README** per-package: `packages/core/README.md` (975B) and `packages/svelte/README.md` (936B) — fixes `This package does not have a README` on npm.
- Root `README.md` badges: `npm version` for both packages + `CI` + `Apache-2.0`.
- `publish.yml` workflow for tag `v*` OIDC provenance (`id-token: write`, `pnpm publish --provenance`).
- `publishConfig` `access: public` + `repository`/`homepage`/`bugs` in both `package.json`.

### Changed

- Rename scope `@chatlayer/*` → `@zalwan/*` (`@chatlayer` org taken on npm, 403).  
  `@chatlayer/core` → `@zalwan/chatlayer`, `@chatlayer/svelte` → `@zalwan/chatlayer-svelte`. Keep dual `paths` alias `@zalwan/*` + `@chatlayer/core` for back-compat (`packages/svelte/tsconfig.json:11`).

### Fixed

- **svelte-check** `14 errors` on clean clone: add `paths` alias + `Message.svelte` strict `ChatContent` typing, reorder CI `build` before `typecheck` (see `6fef787`).

## [0.1.0] - 2026-09-09

### Added

- Initial release — `feat: initial release ChatLayer v0.1 — provider-agnostic chat SDK` (`2c5690e`).
- **Core** `@zalwan/chatlayer` (`packages/core`): `createChat()` state machine `idle→submitted→streaming→idle|error`, `ChatMessage`/`ChatRequest`/`ChatEvent`, `ChatTransport`, `HttpTransport` (`POST` + `Accept: application/x-ndjson` + `X-ChatLayer-Protocol: 1`), `parseNdjsonStream` (lenient, ignore unknown `type`), `writable`/`readable` stores, `PROTOCOL_VERSION:1`. Tests `45 passed`.
- **Svelte** `@zalwan/chatlayer-svelte` (`packages/svelte`): `<ChatWidget>`, `MessageList`, `Message`, `Composer`, `LoadingIndicator`, `ErrorMessage`, `Markdown` (`marked`+`DOMPurify`), `theme` `light|dark|system`. Modern design: glass header + avatar `cl-presence-pulse`, bubble `20px` + `cl-msg-in 0.38s`, pill composer with auto-resize + send/stop icons, typing bubble `cl-typing`. Tests `9 passed`.
- **Examples** `examples/sveltekit` (`<ChatWidget endpoint="/api/chat" />` + mock NDJSON `+server.ts`) and `fixtures/*.jsonl` (basic, streaming, error, tool-events).
- **Docs** `README.md`, `PROTOCOL.md` (human spec, source of truth `types.ts:83`), `PRD.md`, `SECURITY.md`, `LICENSE` Apache-2.0.
- **CI** `ci.yml` (`pnpm install --frozen-lockfile` → `build` → `format:check` → `typecheck` → `test`) for Node `20`/`22`.

### Fixed

- CI `pnpm/action-setup` `ERR_PNPM_BAD_PM_VERSION` — remove `with: version` (`be11daf`, use `packageManager` `pnpm@9.12.0`).
- Prettier `format:check` 7 files (`ba1107d` `pnpm format`).
- svelte-check `Cannot find module @chatlayer/core` on fresh clone (`6fef787`).
- NPM scope `E403 @chatlayer org taken` → migrate to `@zalwan/*` (`18e1334`).

---

[Unreleased]: https://github.com/zalwan/chatlayer/compare/v0.1.5...HEAD
[0.1.5]: https://github.com/zalwan/chatlayer/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/zalwan/chatlayer/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/zalwan/chatlayer/compare/v0.1.1...v0.1.3
[0.1.1]: https://github.com/zalwan/chatlayer/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/zalwan/chatlayer/releases/tag/v0.1.0
