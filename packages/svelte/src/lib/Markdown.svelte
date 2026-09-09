<script lang="ts">
  import DOMPurify from "dompurify";
  import { marked } from "marked";
  import { onMount } from "svelte";

  let { text }: { text: string } = $props();

  // Only render (and sanitize) HTML after mount so SSR stays safe and there is
  // no hydration mismatch — the server and first client render both emit the
  // escaped text, then we swap to sanitized HTML on the client.
  let mounted = $state(false);
  onMount(() => {
    mounted = true;
  });

  const html = $derived(
    mounted ? DOMPurify.sanitize(marked.parse(text, { async: false }) as string) : null,
  );
</script>

{#if html}
  <div class="chatlayer-markdown">{@html html}</div>
{:else}
  <div class="chatlayer-markdown">{text}</div>
{/if}

<style>
  .chatlayer-markdown {
    font-size: 0.95rem;
    line-height: 1.55;
    word-wrap: break-word;
    overflow-wrap: anywhere;
  }

  .chatlayer-markdown :global(p) {
    margin: 0 0 0.6em;
  }
  .chatlayer-markdown :global(p:last-child) {
    margin-bottom: 0;
  }
  .chatlayer-markdown :global(ul),
  .chatlayer-markdown :global(ol) {
    margin: 0 0 0.6em;
    padding-left: 1.4em;
  }
  .chatlayer-markdown :global(li) {
    margin: 0.15em 0;
  }
  .chatlayer-markdown :global(h1),
  .chatlayer-markdown :global(h2),
  .chatlayer-markdown :global(h3) {
    margin: 0.8em 0 0.4em;
    line-height: 1.3;
  }
  .chatlayer-markdown :global(h1) {
    font-size: 1.25rem;
  }
  .chatlayer-markdown :global(h2) {
    font-size: 1.1rem;
  }
  .chatlayer-markdown :global(h3) {
    font-size: 1rem;
  }
  .chatlayer-markdown :global(a) {
    color: var(--cl-accent, #2563eb);
    text-decoration: underline;
  }
  .chatlayer-markdown :global(blockquote) {
    margin: 0 0 0.6em;
    padding: 0.2em 0.8em;
    border-left: 3px solid var(--cl-border, #e5e7eb);
    color: var(--cl-muted, #6b7280);
  }
  .chatlayer-markdown :global(code) {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.85em;
    background: var(--cl-code-bg, rgba(125, 125, 125, 0.16));
    padding: 0.12em 0.35em;
    border-radius: 4px;
  }
  .chatlayer-markdown :global(pre) {
    margin: 0 0 0.6em;
    padding: 0.75em 0.9em;
    background: var(--cl-pre-bg, #0f172a);
    color: var(--cl-pre-fg, #e2e8f0);
    border-radius: 8px;
    overflow-x: auto;
  }
  .chatlayer-markdown :global(pre code) {
    background: transparent;
    padding: 0;
    font-size: 0.85em;
    line-height: 1.5;
  }
  .chatlayer-markdown :global(table) {
    border-collapse: collapse;
    margin: 0 0 0.6em;
  }
  .chatlayer-markdown :global(th),
  .chatlayer-markdown :global(td) {
    border: 1px solid var(--cl-border, #e5e7eb);
    padding: 0.3em 0.6em;
  }
  .chatlayer-markdown :global(hr) {
    border: none;
    border-top: 1px solid var(--cl-border, #e5e7eb);
    margin: 0.8em 0;
  }
</style>
