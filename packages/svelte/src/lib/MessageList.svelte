<script lang="ts">
  import type { ChatInstance } from "@zalwan/chatlayer";
  import LoadingIndicator from "./LoadingIndicator.svelte";
  import Message from "./Message.svelte";

  let { chat }: { chat: ChatInstance } = $props();

  // Reactive reads of the `chat` prop (avoids state_referenced_locally warning).
  const messages = $derived(chat.messages);
  const status = $derived(chat.status);
  const showLoading = $derived($status === "submitted");

  let listEl: HTMLDivElement | null = $state(null);

  // Auto-scroll to the newest content as it streams in. Reading the stores
  // inside the effect tracks them so it re-runs on any message/status change.
  $effect(() => {
    void $messages;
    void $status;
    if (listEl) {
      listEl.scrollTop = listEl.scrollHeight;
    }
  });
</script>

<div class="chatlayer-messages" bind:this={listEl}>
  {#each $messages as message (message.id)}
    <Message {message} />
  {/each}
  {#if showLoading}
    <div class="chatlayer-messages__loading">
      <LoadingIndicator />
    </div>
  {/if}
  {#if $messages.length === 0 && !showLoading}
    <div class="chatlayer-messages__empty">
      <div class="chatlayer-messages__empty-icon">✦</div>
      <p class="chatlayer-messages__empty-title">Mulai percakapan</p>
      <p class="chatlayer-messages__empty-sub">Tanya apa saja — Zal siap bantu.</p>
    </div>
  {/if}
</div>

<style>
  .chatlayer-messages {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    overflow-x: clip;
    padding: 0.75rem 0 0.75rem;
    min-height: 0;
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: var(--cl-border) transparent;
  }

  .chatlayer-messages::-webkit-scrollbar {
    width: 5px;
  }
  .chatlayer-messages::-webkit-scrollbar-thumb {
    background: var(--cl-border);
    border-radius: 999px;
  }

  .chatlayer-messages__loading {
    padding: 0.2rem 0.9rem 0.4rem;
    animation: cl-fade-in 0.3s ease both;
  }

  .chatlayer-messages__empty {
    display: grid;
    place-items: center;
    gap: 0.35rem;
    padding: 2.2rem 1.2rem;
    text-align: center;
    animation: cl-fade-in 0.4s ease both;
  }
  .chatlayer-messages__empty-icon {
    width: 2.4rem;
    height: 2.4rem;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: var(--cl-assistant-bg);
    border: 1px solid var(--cl-border);
    font-size: 1.1rem;
    color: var(--cl-muted);
  }
  .chatlayer-messages__empty-title {
    margin: 0.3rem 0 0;
    font-weight: 600;
    font-size: 0.92rem;
    letter-spacing: -0.01em;
    color: var(--cl-fg);
  }
  .chatlayer-messages__empty-sub {
    margin: 0;
    font-size: 0.82rem;
    color: var(--cl-muted);
  }

  @keyframes cl-fade-in {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .chatlayer-messages {
      scroll-behavior: auto;
    }
    .chatlayer-messages__loading,
    .chatlayer-messages__empty {
      animation: none;
    }
  }
</style>
