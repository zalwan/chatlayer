<script lang="ts">
  import { ChatWidget } from "@chatlayer/svelte";
</script>

<svelte:head>
  <title>ChatLayer — SvelteKit Example</title>
</svelte:head>

<main>
  <header>
    <h1>ChatLayer <span>SvelteKit Example</span></h1>
    <p>
      Provider-agnostic widget → <code>/api/chat</code> mock streaming (see
      <code>src/routes/api/chat/+server.ts</code>). Replace the handler with your
      OpenAI / Anthropic / Ollama backend — frontend stays the same.
    </p>
  </header>

  <section class="frame">
    <ChatWidget endpoint="/api/chat" title="ChatLayer Demo" placeholder="Type a message…" theme="system" />
  </section>

  <details>
    <summary>Headless alternative (same transport)</summary>
    <pre><code>{`import { createChat, HttpTransport } from "@chatlayer/core";
const chat = createChat({ transport: new HttpTransport("/api/chat") });
await chat.send("Hello");
// chat.messages, chat.status, chat.error are Svelte stores`}</code></pre>
  </details>
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: ui-sans-serif, system-ui, sans-serif;
    background: #f8fafc;
    color: #0f172a;
  }
  main {
    max-width: 860px;
    margin: 0 auto;
    padding: 2rem 1rem 3rem;
  }
  header h1 {
    margin: 0 0 0.3rem;
    font-size: 1.6rem;
  }
  header h1 span {
    font-weight: 400;
    color: #64748b;
  }
  header p {
    margin: 0 0 1.2rem;
    color: #475569;
    line-height: 1.5;
  }
  header code,
  details code {
    font-family: ui-monospace, monospace;
    font-size: 0.9em;
  }
  .frame {
    height: 520px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);
  }
  details {
    margin-top: 1rem;
    color: #334155;
  }
  details pre {
    background: #0f172a;
    color: #e2e8f0;
    padding: 0.9rem 1rem;
    border-radius: 8px;
    overflow-x: auto;
  }
</style>
