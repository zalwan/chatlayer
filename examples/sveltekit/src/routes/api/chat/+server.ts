import type { RequestHandler } from "@sveltejs/kit";
import type { ChatRequest } from "@zalwan/chatlayer";
import { NDJSON_CONTENT_TYPE, PROTOCOL_HEADER, PROTOCOL_VERSION } from "@zalwan/chatlayer";

/**
 * Mock backend — echo + streaming demo.
 * Replace with your real AI call (OpenAI / Anthropic / Gemini / Ollama / custom).
 * Must speak the ChatLayer protocol: NDJSON `message.start` → `message.delta`* → `message.end`
 * (see PROTOCOL.md §4 and fixtures/*.jsonl).
 */
export const POST: RequestHandler = async ({ request }) => {
  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return jsonError(400, "BAD_REQUEST", "Invalid JSON body.");
  }

  const lastUser = [...(body.messages ?? [])].reverse().find((m) => m.role === "user");
  const userText =
    lastUser?.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("") ?? "Hello";

  // Simulate failure for testing ErrorMessage + retry
  if (/error/i.test(userText)) {
    return ndjsonStream(async function* () {
      const id = `msg_${crypto.randomUUID()}`;
      yield { type: "message.start", messageId: id, role: "assistant" as const };
      yield { type: "error", code: "MODEL_ERROR", message: "Mock model error — try again." };
    });
  }

  const reply = mockReply(userText);

  return ndjsonStream(async function* () {
    const id = `msg_${crypto.randomUUID()}`;
    yield { type: "message.start", messageId: id, role: "assistant" as const };
    for (const chunk of chunkByWords(reply, 3)) {
      await delay(35);
      yield { type: "message.delta", messageId: id, text: chunk };
    }
    yield { type: "message.end", messageId: id };
  });
};

function mockReply(userText: string): string {
  const t = userText.trim().slice(0, 120);
  return `You said: **${escapeMd(t)}**\n\nThis is a mock streaming reply from \`/api/chat\`. Try:\n- **bold** / *italic* / \`code\`\n- type \`error\` to trigger retry\n\nBackend owns model & persona — UI only speaks the protocol.`;
}

function escapeMd(s: string): string {
  return s.replace(/[*`_]/g, "\\$&");
}

function chunkByWords(text: string, n: number): string[] {
  const words = text.split(/(\s+)/);
  const out: string[] = [];
  for (let i = 0; i < words.length; i += n) out.push(words.slice(i, i + n).join(""));
  return out;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function ndjsonStream(events: () => AsyncGenerator<Record<string, unknown>>): Response {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      for await (const e of events()) {
        controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      }
      controller.close();
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

function jsonError(status: number, code: string, message: string): Response {
  return new Response(JSON.stringify({ type: "error", code, message }) + "\n", {
    status,
    headers: { "Content-Type": NDJSON_CONTENT_TYPE },
  });
}
