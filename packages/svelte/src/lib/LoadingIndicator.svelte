<script lang="ts">
  let { label = "Thinking" }: { label?: string } = $props();
</script>

<div class="chatlayer-loading" role="status" aria-live="polite">
  <span class="chatlayer-loading__bubble">
    <span class="chatlayer-loading__dots">
      <span class="chatlayer-loading__dot"></span>
      <span class="chatlayer-loading__dot"></span>
      <span class="chatlayer-loading__dot"></span>
    </span>
  </span>
  {#if label}<span class="chatlayer-loading__label">{label}</span>{/if}
</div>

<style>
  .chatlayer-loading {
    display: inline-flex;
    align-items: center;
    gap: 0.55em;
    font-size: 0.9rem;
    color: var(--cl-muted);
  }

  .chatlayer-loading__bubble {
    display: inline-flex;
    align-items: center;
    padding: 0.62em 0.9em;
    border-radius: 18px;
    border-bottom-left-radius: 6px;
    background: var(--cl-assistant-bg);
    border: 1px solid color-mix(in srgb, var(--cl-border) 70%, transparent);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .chatlayer-loading__dots {
    display: inline-flex;
    gap: 0.24em;
    align-items: center;
  }

  .chatlayer-loading__dot {
    width: 0.38rem;
    height: 0.38rem;
    border-radius: 50%;
    background: var(--cl-muted);
    animation: cl-typing 1.25s infinite ease-in-out;
  }

  .chatlayer-loading__dot:nth-child(2) {
    animation-delay: 0.18s;
  }
  .chatlayer-loading__dot:nth-child(3) {
    animation-delay: 0.36s;
  }

  .chatlayer-loading__label {
    font-size: 0.78rem;
    letter-spacing: 0.02em;
    opacity: 0.9;
  }

  @keyframes cl-typing {
    0%,
    80%,
    100% {
      opacity: 0.35;
      transform: translateY(0) scale(0.9);
    }
    40% {
      opacity: 1;
      transform: translateY(-2px) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .chatlayer-loading__dot {
      animation: none;
      opacity: 0.6;
    }
  }
</style>
