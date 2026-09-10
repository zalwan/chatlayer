import type { ChatRequest } from "@zalwan/chatlayer";
import { NDJSON_CONTENT_TYPE, PROTOCOL_HEADER, PROTOCOL_VERSION } from "@zalwan/chatlayer";

/** Provider-agnostic message shape used by OpenAI / Ollama chat APIs. */
export interface ProviderMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Flatten ChatLayer content parts to plain text (MVP only has `text`). */
export function toProviderMessages(body: ChatRequest): ProviderMessage[] {
  return (body.messages ?? []).map((m) => ({
    role: m.role === "system" ? "system" : m.role === "assistant" ? "assistant" : "user",
    content: m.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join(""),
  }));
}

export function ndjsonResponse(events: () => AsyncGenerator<Record<string, unknown>>): Response {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        for await (const e of events()) {
          controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
        }
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": NDJSON_CONTENT_TYPE,
      [PROTOCOL_HEADER]: String(PROTOCOL_VERSION),
      "Cache-Control": "no-cache",
    },
  });
}

export function jsonError(status: number, code: string, message: string): Response {
  return new Response(JSON.stringify({ type: "error", code, message }) + "\n", {
    status,
    headers: { "Content-Type": NDJSON_CONTENT_TYPE },
  });
}

export function newAssistantId(): string {
  return `msg_${crypto.randomUUID()}`;
}
