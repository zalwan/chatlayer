<script lang="ts">
  import {
    createChat,
    HttpTransport,
    type ChatInstance,
    type ChatTransport,
  } from "@zalwan/chatlayer";
  import { fade, fly } from "svelte/transition";
  import { cubicInOut, cubicOut } from "svelte/easing";
  import Composer from "./Composer.svelte";
  import ErrorMessage from "./ErrorMessage.svelte";
  import MessageList from "./MessageList.svelte";
  import { applyTheme, themeStore, type ThemePreference } from "./theme.js";

  export type ChatLayout = "inline" | "bubble" | "fullscreen";

  let {
    endpoint,
    transport,
    theme = "system",
    placeholder = "Type a message…",
    title = "Chat",
    layout = "inline",
  }: {
    endpoint?: string;
    transport?: ChatTransport;
    theme?: ThemePreference;
    placeholder?: string;
    title?: string;
    layout?: ChatLayout;
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

  let open = $state(false);
  function toggle() {
    open = !open;
  }
  function onFabKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && open) open = false;
  }

  const reducedMotion = $derived(
    typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
</script>

<svelte:window onkeydown={onFabKeydown} />

{#if layout === "bubble"}
  <!-- FAB -->
  <button
    onclick={toggle}
    aria-label={open ? "Close chat" : "Open chat"}
    aria-expanded={open}
    class="cl-fab"
  >
    <span
      class="cl-fab__ring"
      class:cl-fab__ring--pulse={!open && !reducedMotion}
      aria-hidden="true"
    ></span>
    <span class="cl-fab__sheen" aria-hidden="true"></span>
    <span class="cl-fab__icon" class:cl-fab__icon--open={open} aria-hidden="true">
      {#if open}
        <!-- X — cleaner 20x20 -->
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg
        >
      {:else}
        <!-- Robot — AI assistant -->
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.9"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path
            d="M12 7v4"
          /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></svg
        >
      {/if}
    </span>
    {#if !open}
      <span class="cl-fab__badge" aria-hidden="true">
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          stroke-width="2.2"
          stroke-linecap="round"
          ><path
            d="M12 7l1.4 4.2L17.5 12l-4.1 1.4L12 17.5l-1.4-4.1L6.5 12l4.1-.8L12 7Z"
            fill="white"
          /></svg
        >
      </span>
    {/if}
  </button>

  {#if open}
    <button
      aria-label="Close chat backdrop"
      onclick={() => (open = false)}
      class="cl-backdrop"
      transition:fade={{ duration: reducedMotion ? 0 : 220, easing: cubicOut }}
    ></button>
    <div
      class="cl-panel"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      transition:fly={{
        y: reducedMotion ? 0 : 14,
        duration: reducedMotion ? 0 : 360,
        easing: cubicInOut,
      }}
    >
      <div class="chatlayer chatlayer--bubble-inner" data-theme={$themeStore}>
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
      <div class="cl-panel__footer">
        <span class="cl-panel__dot"></span>
        Powered by ChatLayer • {title}
      </div>
    </div>
  {/if}
{:else}
  <div class="chatlayer" data-theme={$themeStore} data-layout={layout}>
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
{/if}

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
    background: radial-gradient(
      ellipse at 50% 0%,
      color-mix(in srgb, var(--cl-accent) 8%, transparent) 0%,
      transparent 70%
    );
    pointer-events: none;
  }

  @keyframes cl-presence-pulse {
    0%,
    100% {
      box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.25);
    }
    50% {
      box-shadow: 0 0 0 5px rgba(34, 197, 94, 0);
    }
  }

  .chatlayer[data-layout="inline"] {
    border: 1px solid var(--cl-border);
    border-radius: 24px;
    box-shadow: var(--cl-shadow);
    overflow: hidden;
  }

  .chatlayer[data-layout="fullscreen"] {
    height: 100vh;
    height: 100dvh;
    border-radius: 0;
  }

  .chatlayer--bubble-inner {
    height: 100%;
    min-height: 0;
  }

  /* FAB — gradient + inner highlight */
  .cl-fab {
    position: fixed;
    right: 1.25rem;
    bottom: 1.25rem;
    z-index: 60;
    width: 3.75rem;
    height: 3.75rem;
    display: grid;
    place-items: center;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: radial-gradient(120% 120% at 30% 20%, #334155 0%, #0f172a 55%, #020617 100%);
    color: #ffffff;
    box-shadow:
      0 10px 32px rgba(2, 6, 23, 0.28),
      0 4px 12px rgba(2, 6, 23, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.16);
    cursor: pointer;
    transition:
      transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
      box-shadow 0.28s ease,
      filter 0.28s ease;
  }
  .cl-fab:hover {
    transform: scale(1.05) translateY(-1px);
    box-shadow:
      0 14px 40px rgba(2, 6, 23, 0.32),
      0 6px 16px rgba(2, 6, 23, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    filter: brightness(1.06);
  }
  .cl-fab:active {
    transform: scale(0.96);
  }
  .cl-fab:focus-visible {
    outline: 2px solid #38bdf8;
    outline-offset: 2px;
  }
  :global(.dark) .cl-fab {
    background: radial-gradient(120% 120% at 30% 20%, #f8fafc 0%, #e2e8f0 55%, #cbd5e1 100%);
    color: #0f172a;
    border-color: rgba(15, 23, 42, 0.08);
    box-shadow:
      0 10px 32px rgba(0, 0, 0, 0.22),
      0 4px 12px rgba(0, 0, 0, 0.16),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }

  .cl-fab__ring {
    position: absolute;
    inset: 0;
    border-radius: 999px;
    border: 1px solid rgba(15, 23, 42, 0.1);
    pointer-events: none;
  }
  .cl-fab__ring--pulse {
    animation: cl-fab-pulse 2.6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  .cl-fab__sheen {
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 60%);
    pointer-events: none;
  }
  .cl-fab__icon {
    display: grid;
    place-items: center;
    transition: transform 0.3s ease;
  }
  .cl-fab__icon--open {
    transform: rotate(90deg);
  }
  .cl-fab__badge {
    position: absolute;
    right: -0.25rem;
    top: -0.25rem;
    width: 1.25rem;
    height: 1.25rem;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: #22c55e;
    color: #ffffff;
    font-size: 0.65rem;
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    border: 2px solid #ffffff;
  }

  .cl-backdrop {
    position: fixed;
    inset: 0;
    z-index: 59;
    border: none;
    background: rgba(15, 23, 42, 0.25);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    cursor: pointer;
  }

  .cl-panel {
    position: fixed;
    right: 1.25rem;
    bottom: 5.5rem;
    z-index: 60;
    width: min(400px, calc(100vw - 1.5rem));
    height: min(560px, 72vh);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 24px;
    border: 1px solid rgba(226, 232, 240, 0.7);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.18),
      0 8px 24px rgba(0, 0, 0, 0.12);
  }
  :global(.dark) .cl-panel {
    background: rgba(15, 23, 42, 0.9);
    border-color: rgba(51, 65, 85, 0.5);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }

  .cl-panel__footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.5rem 0.75rem;
    border-top: 1px solid color-mix(in srgb, var(--cl-border) 70%, transparent);
    background: color-mix(in srgb, var(--cl-bg-soft) 85%, transparent);
    font-size: 0.68rem;
    letter-spacing: 0.02em;
    color: var(--cl-muted);
  }

  .cl-panel__dot {
    width: 0.38rem;
    height: 0.38rem;
    border-radius: 999px;
    background: #22c55e;
    animation: cl-presence-pulse 2s infinite;
  }

  @keyframes cl-fab-pulse {
    0% {
      transform: scale(1);
      opacity: 0.55;
    }
    70%,
    100% {
      transform: scale(1.45);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .chatlayer__presence,
    .cl-fab__ring--pulse,
    .cl-panel__dot {
      animation: none;
    }
    .cl-fab {
      transition: none;
    }
  }
</style>
