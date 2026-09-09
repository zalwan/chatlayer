<script lang="ts">
  import type { ChatContent, ChatMessage } from "@zalwan/chatlayer";
  import Markdown from "./Markdown.svelte";

  let { message }: { message: ChatMessage } = $props();

  const text = $derived(
    message.content
      .filter(
        (part: ChatContent): part is Extract<ChatContent, { type: "text" }> => part.type === "text",
      )
      .map((part) => part.text)
      .join(""),
  );

  const isEmpty = $derived(text.trim() === "");
</script>

<div class="chatlayer-message" data-role={message.role}>
  <div class="chatlayer-message__bubble">
    {#if message.role === "assistant"}
      {#if isEmpty}
        <span class="chatlayer-message__placeholder">…</span>
      {:else}
        <Markdown {text} />
      {/if}
    {:else}
      <span class="chatlayer-message__text">{text}</span>
    {/if}
  </div>
</div>

<style>
  .chatlayer-message {
    display: flex;
    width: 100%;
    padding: 0.28rem 0.9rem;
    animation: cl-msg-in 0.38s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .chatlayer-message[data-role="user"] {
    justify-content: flex-end;
  }
  .chatlayer-message[data-role="assistant"] {
    justify-content: flex-start;
  }

  .chatlayer-message__bubble {
    max-width: 82%;
    padding: 0.62em 0.95em;
    border-radius: 20px;
    line-height: 1.5;
    font-size: 0.92rem;
    position: relative;
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.06),
      0 4px 12px rgba(0, 0, 0, 0.04);
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease;
    will-change: transform;
  }

  .chatlayer-message__bubble:hover {
    transform: translateY(-1px);
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.08),
      0 8px 20px rgba(0, 0, 0, 0.06);
  }

  .chatlayer-message[data-role="user"] .chatlayer-message__bubble {
    background: var(--cl-user-bg, linear-gradient(135deg, #0f172a 0%, #334155 100%));
    color: var(--cl-user-fg, #ffffff);
    border-bottom-right-radius: 6px;
  }

  /* ensure gradient var works even when it's a plain color */
  .chatlayer-message[data-role="user"] .chatlayer-message__bubble {
    background-color: var(--cl-accent);
  }

  .chatlayer-message[data-role="assistant"] .chatlayer-message__bubble {
    background: var(--cl-assistant-bg, #f1f5f9);
    color: var(--cl-assistant-fg, var(--cl-fg, #0f172a));
    border-bottom-left-radius: 6px;
    border: 1px solid color-mix(in srgb, var(--cl-border) 70%, transparent);
  }

  .chatlayer-message__text {
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: anywhere;
  }

  .chatlayer-message__placeholder {
    color: var(--cl-muted, #94a3b8);
    letter-spacing: 0.08em;
  }

  @keyframes cl-msg-in {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .chatlayer-message {
      animation: none;
    }
    .chatlayer-message__bubble:hover {
      transform: none;
    }
  }
</style>
