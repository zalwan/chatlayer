<script lang="ts">
  import type { ChatInstance } from "@zalwan/chatlayer";

  let { chat }: { chat: ChatInstance } = $props();

  const { error } = chat;

  let retrying = $state(false);

  async function retry() {
    if (retrying) return;
    retrying = true;
    try {
      await chat.retry();
    } finally {
      retrying = false;
    }
  }
</script>

{#if $error}
  <div class="chatlayer-error" role="alert">
    <span class="chatlayer-error__text">{$error.message}</span>
    <button class="chatlayer-error__retry" onclick={retry} disabled={retrying}>
      {retrying ? "Retrying…" : "Retry"}
    </button>
  </div>
{/if}

<style>
  .chatlayer-error {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6em;
    margin: 0.4rem 0.9rem;
    padding: 0.6em 0.85em;
    background: var(--cl-error-bg);
    color: var(--cl-error-fg);
    border: 1px solid var(--cl-error-border);
    border-radius: 12px;
    font-size: 0.84rem;
    line-height: 1.4;
    animation: cl-error-in 0.32s cubic-bezier(0.16, 1, 0.3, 1) both;
    box-shadow: 0 2px 10px color-mix(in srgb, var(--cl-error-border) 35%, transparent);
  }

  .chatlayer-error__retry {
    flex: none;
    border: none;
    background: var(--cl-error-fg);
    color: var(--cl-error-bg);
    border-radius: 999px;
    padding: 0.32em 0.85em;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      transform 0.15s ease,
      opacity 0.15s ease;
  }
  .chatlayer-error__retry:hover {
    transform: translateY(-1px);
  }
  .chatlayer-error__retry:active {
    transform: scale(0.97);
  }

  .chatlayer-error__retry:disabled {
    cursor: default;
    opacity: 0.6;
    transform: none;
  }

  @keyframes cl-error-in {
    from {
      opacity: 0;
      transform: translateY(6px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .chatlayer-error {
      animation: none;
    }
  }
</style>
