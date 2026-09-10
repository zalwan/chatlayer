import type { RequestHandler } from "@sveltejs/kit";
import type { ChatRequest } from "@zalwan/chatlayer";
import {
  jsonError,
  ndjsonResponse,
  newAssistantId,
  toProviderMessages,
} from "$lib/server/chat-events";

/**
 * Real OpenAI backend — proves ChatLayer is provider-agnostic.
 * Frontend (`<ChatWidget endpoint="/api/chat-openai" />`) is unchanged;
 * only this handler knows about OpenAI.
 *
 * Env: OPENAI_API_KEY (required), OPENAI_MODEL (default gpt-4o-mini).
 * No extra deps — plain fetch + SSE → ChatLayer NDJSON protocol.
 */
const SYSTEM_PROMPT = "You are a concise, friendly assistant. Reply in Markdown.";

export const POST: RequestHandler = async ({ request }) => {
  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return jsonError(400, "BAD_REQUEST", "Invalid JSON body.");
  }
  if (!Array.isArray(body.messages)) {
    return jsonError(400, "BAD_REQUEST", "`messages` must be an array.");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return jsonError(500, "SERVER_ERROR", "OPENAI_API_KEY is not set on the server.");
  }
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal: request.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...toProviderMessages(body)],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    const code = upstream.status >= 500 ? "SERVER_ERROR" : "BAD_REQUEST";
    return jsonError(
      upstream.status,
      code,
      `OpenAI error (${upstream.status}). ${detail.slice(0, 200)}`,
    );
  }

  return ndjsonResponse(async function* () {
    const id = newAssistantId();
    yield { type: "message.start", messageId: id, role: "assistant" as const };

    const reader = upstream.body!.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split("\n\n");
      buf = parts.pop() ?? "";
      for (const part of parts) {
        for (const line of part.split("\n")) {
          const text = line.replace(/^data:\s*/, "").trim();
          if (!text || text === "[DONE]") continue;
          try {
            const json = JSON.parse(text) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const delta = json.choices?.[0]?.delta?.content ?? "";
            if (delta) yield { type: "message.delta", messageId: id, text: delta };
          } catch {
            // Ignore provider heartbeat / malformed SSE lines.
          }
        }
      }
    }
    yield { type: "message.end", messageId: id };
  });
};
