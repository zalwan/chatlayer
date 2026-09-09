<script lang="ts">
  import {
    createChat,
    HttpTransport,
    type ChatInstance,
    type ChatTransport,
  } from "@chatlayer/core";
  import Composer from "./Composer.svelte";
  import ErrorMessage from "./ErrorMessage.svelte";
  import MessageList from "./MessageList.svelte";
  import { applyTheme, themeStore, type ThemePreference } from "./theme";

  let {
    endpoint,
    transport,
    theme = "system",
    placeholder = "Type a message…",
    title = "Chat",
  }: {
    endpoint?: string;
    transport?: ChatTransport;
    theme?: ThemePreference;
    placeholder?: string;
    title?: string;
  } = $props();

  // Lazily create the chat runtime. Reading `endpoint`/`transport` inside a
  // derived keeps the reads reactive (no initial-value capture warning), and
  // the result is stable for the widget's lifetime.
  const chat = $derived.by((): ChatInstance => {
    if (!transport && !endpoint) {
      throw new Error("ChatWidget requires either an `endpoint` or a `transport` prop.");
    }
    return createChat({
      transport: transport ?? (endpoint ? new HttpTransport(endpoint) : undefined),
    });
  });

  $effect(() => {
    applyTheme(theme);
  });

  const initial = $derived(title.slice(0, 1).toUpperCase());
</script>

<div class="chatlayer" data-theme={$themeStore}>
  {#if title}
    <header class="chatlayer__header">
      <div class="chatlayer__avatar" aria-hidden="true">
        <span>{initial}</span>
        <span class="chatlayer__presence"></span>
      </div>
      <div class="chatlayer__header-text">
        <span class="chatlayer__title">{title}</span>
        <span class="chatlayer__subtitle">AI assistant • Balas instan</span>
      </div>
      <span class="chatlayer__header-glow" aria-hidden="true"></span>
    </header>
  {/if}

  <MessageList {chat} />
  <ErrorMessage {chat} />
  <Composer {chat} {placeholder} />
</div>

<style>
  .chatlayer {
    /* Light theme tokens — aligned with Zal oklch but with fallback hex */
    --cl-bg: #ffffff;
    --cl-bg-soft: #f8fafc;
    --cl-fg: #0f172a;
    --cl-muted: #64748b;
    --cl-border: #e2e8f0;
    --cl-input-bg: #ffffff;
    --cl-accent: #0f172a;
    --cl-accent-soft: #e2e8f0;
    --cl-danger: #ef4444;
    --cl-user-bg: linear-gradient(135deg, #0f172a 0%, #334155 100%);
    --cl-user-fg: #ffffff;
    --cl-assistant-bg: #f1f5f9;
    --cl-assistant-fg: #0f172a;
    --cl-pre-bg: #020617;
    --cl-pre-fg: #e2e8f0;
    --cl-error-bg: #fef2f2;
    --cl-error-fg: #991b1b;
    --cl-error-border: #fecaca;
    --cl-radius: 18px;
    --cl-shadow: 0 8px 32px rgba(15, 23, 42, 0.08);

    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: var(--cl-bg);
    color: var(--cl-fg);
    font-family:
      ui-sans-serif,
      system-ui,
      -apple-system,
      "Segoe UI",
      Roboto,
      Helvetica,
      Arial,
      sans-serif;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
  }

  .chatlayer[data-theme="dark"] {
    --cl-bg: #0b0f19;
    --cl-bg-soft: #111827;
    --cl-fg: #f1f5f9;
    --cl-muted: #94a3b8;
    --cl-border: #1e293b;
    --cl-input-bg: #1e293b;
    --cl-accent: #f8fafc;
    --cl-accent-soft: #334155;
    --cl-danger: #f87171;
    --cl-user-bg: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    --cl-user-fg: #0f172a;
    --cl-assistant-bg: #1e293b;
    --cl-assistant-fg: #f1f5f9;
    --cl-pre-bg: #020617;
    --cl-pre-fg: #e2e8f0;
    --cl-error-bg: #1c0a0a;
    --cl-error-fg: #fca5a5;
    --cl-error-border: #451a1a;
    --cl-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }

  .chatlayer *,
  .chatlayer *::before,
  .chatlayer *::after {
    box-sizing: border-box;
  }

  .chatlayer__header {
    flex: none;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.9rem 1rem;
    border-bottom: 1px solid var(--cl-border);
    background: linear-gradient(180deg, var(--cl-bg) 0%, var(--cl-bg-soft) 100%);
    position: relative;
    overflow: hidden;
  }

  .chatlayer__avatar {
    position: relative;
    flex: none;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 999px;
    display: grid;
    place-items: center;
    background: var(--cl-accent);
    color: var(--cl-bg);
    font-weight: 700;
    font-size: 0.95rem;
    letter-spacing: -0.02em;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }

  .chatlayer__presence {
    position: absolute;
    right: -1px;
    bottom: -1px;
    width: 0.68rem;
    height: 0.68rem;
    border-radius: 999px;
    background: #22c55e;
    border: 2px solid var(--cl-bg);
    box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.25);
    animation: cl-presence-pulse 2s infinite;
  }

  .chatlayer__header-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 0.12rem;
  }

  .chatlayer__title {
    font-weight: 650;
    font-size: 0.92rem;
    letter-spacing: -0.015em;
    line-height: 1.2;
  }

  .chatlayer__subtitle {
    font-size: 0.72rem;
    color: var(--cl-muted);
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  .chatlayer__header-glow {
    position: absolute;
    inset: auto -30% -60% -30%;
    height: 60%;
    background: radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--cl-accent) 8%, transparent) 0%, transparent 70%);
    pointer-events: none;
  }

  @keyframes cl-presence-pulse {
    0%, 100% { box-shadow: 0 0 0 2px rgba(34,197,94,0.25); }
    50% { box-shadow: 0 0 0 5px rgba(34,197,94,0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .chatlayer__presence { animation: none; }
  }
</style>
