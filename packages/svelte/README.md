# @zalwan/chatlayer-svelte

[![npm](https://img.shields.io/npm/v/@zalwan/chatlayer-svelte?color=0f172a)](https://www.npmjs.com/package/@zalwan/chatlayer-svelte) [![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](../../LICENSE)

Svelte 5 UI for **ChatLayer** — modern `<ChatWidget>` with glass header, animated bubbles (20px, `cl-msg-in`), pill composer, typing bubble, error pill, `prefers-reduced-motion` support.

```svelte
<script>
  import { ChatWidget } from "@zalwan/chatlayer-svelte";
</script>

<ChatWidget endpoint="/api/chat" title="Tanya Zal" placeholder="Tanya sesuatu…" theme="system" />
```

Headless re-export: `createChat`, `HttpTransport` and all core types.

```ts
import { createChat, HttpTransport } from "@zalwan/chatlayer-svelte";
// or from "@zalwan/chatlayer"
```

Requires `svelte ^5`, `node >=20`. See root [README](../../README.md) + [example](../../examples/sveltekit/).
