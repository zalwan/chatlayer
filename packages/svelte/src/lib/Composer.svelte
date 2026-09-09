<script lang="ts">
  import type { ChatInstance } from "@chatlayer/core";

  let { chat, placeholder = "Type a message…" }: { chat: ChatInstance; placeholder?: string } =
    $props();

  const { status } = chat;

  let value = $state("");

  const busy = $derived($status === "submitted" || $status === "streaming");
  const canSend = $derived(value.trim().length > 0 && !busy);

  let textareaEl: HTMLTextAreaElement | null = $state(null);

  function autoresize() {
    if (!textareaEl) return;
    textareaEl.style.height = "auto";
    textareaEl.style.height = Math.min(textareaEl.scrollHeight, 144) + "px";
  }

  $effect(() => {
    void value;
    autoresize();
  });

  async function submit() {
    if (!canSend) return;
    const text = value;
    value = "";
    await chat.send(text);
    requestAnimationFrame(() => textareaEl?.focus());
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }
</script>

<div class="chatlayer-composer">
  <div class="chatlayer-composer__field">
    <textarea
      bind:this={textareaEl}
      class="chatlayer-composer__input"
      bind:value
      {placeholder}
      onkeydown={onKeydown}
      oninput={autoresize}
      rows="1"
      aria-label="Message"
    ></textarea>
    {#if busy}
      <button
        class="chatlayer-composer__action chatlayer-composer__stop"
        onclick={() => chat.stop()}
        aria-label="Stop generation"
        title="Stop"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
          ><rect x="2.5" y="2.5" width="9" height="9" rx="1.5" fill="currentColor" /></svg
        >
      </button>
    {:else}
      <button
        class="chatlayer-composer__action chatlayer-composer__send"
        onclick={submit}
        disabled={!canSend}
        aria-label="Send message"
        title="Send"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
          ><path
            d="M14.5 1.5L7.2 8.2"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
          /><path
            d="M14.5 1.5L9.1 14.1L7.2 8.2L1.5 6.2L14.5 1.5Z"
            fill="currentColor"
            stroke="currentColor"
            stroke-width="1.15"
            stroke-linejoin="round"
          /></svg
        >
      </button>
    {/if}
  </div>
  <span class="chatlayer-composer__hint">↵ kirim • ⇧↵ baris baru</span>
</div>

<style>
  .chatlayer-composer {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    padding: 0.75rem 0.75rem 0.65rem;
    border-top: 1px solid var(--cl-border);
    background: color-mix(in srgb, var(--cl-bg) 92%, var(--cl-bg-soft) 8%);
  }

  .chatlayer-composer__field {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    padding: 0.42rem 0.42rem 0.42rem 0.9rem;
    border: 1px solid var(--cl-border);
    border-radius: 999px;
    background: var(--cl-input-bg);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    transition:
      border-color 0.18s ease,
      box-shadow 0.18s ease,
      transform 0.18s ease;
  }

  .chatlayer-composer__field:focus-within {
    border-color: color-mix(in srgb, var(--cl-accent) 30%, var(--cl-border));
    box-shadow:
      0 0 0 3px color-mix(in srgb, var(--cl-accent) 12%, transparent),
      0 4px 16px rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);
  }

  .chatlayer-composer__input {
    flex: 1;
    resize: none;
    max-height: 9rem;
    min-height: 1.4rem;
    padding: 0.32rem 0;
    border: none;
    background: transparent;
    color: var(--cl-fg);
    font: inherit;
    font-size: 0.9rem;
    line-height: 1.5;
    outline: none;
  }

  .chatlayer-composer__input::placeholder {
    color: var(--cl-muted);
    opacity: 0.9;
  }

  .chatlayer-composer__action {
    flex: none;
    width: 2.15rem;
    height: 2.15rem;
    display: grid;
    place-items: center;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    transition:
      transform 0.16s cubic-bezier(0.16, 1, 0.3, 1),
      opacity 0.16s ease,
      background 0.16s ease,
      box-shadow 0.16s ease;
  }

  .chatlayer-composer__action:active {
    transform: scale(0.94);
  }

  .chatlayer-composer__send {
    background: var(--cl-accent);
    color: var(--cl-bg);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }

  .chatlayer-composer__send:hover:not(:disabled) {
    transform: translateY(-1px) scale(1.02);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
  }

  .chatlayer-composer__stop {
    background: var(--cl-danger);
    color: #fff;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
    animation: cl-stop-pulse 1.4s infinite;
  }

  .chatlayer-composer__action:disabled {
    opacity: 0.42;
    cursor: default;
    transform: none;
    box-shadow: none;
  }

  .chatlayer-composer__hint {
    font-size: 0.68rem;
    color: var(--cl-muted);
    letter-spacing: 0.02em;
    padding-left: 0.3rem;
    opacity: 0.85;
  }

  @keyframes cl-stop-pulse {
    0%,
    100% {
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
    }
    50% {
      box-shadow: 0 2px 14px rgba(239, 68, 68, 0.45);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .chatlayer-composer__field:focus-within {
      transform: none;
    }
    .chatlayer-composer__action,
    .chatlayer-composer__stop {
      animation: none;
    }
  }
</style>
