import type { RequestHandler } from "@sveltejs/kit";
import type { ChatRequest } from "@zalwan/chatlayer";
import {
  jsonError,
  ndjsonResponse,
  newAssistantId,
  toProviderMessages,
} from "$lib/server/chat-events";

/**
 * Real Ollama backend (local, self-hosted) — proves ChatLayer works
 * without any cloud vendor.
 *
 * Env: OLLAMA_URL (default http://localhost:11434), OLLAMA_MODEL (default llama3.1).
 * Requires `ollama serve` + `ollama pull llama3.1` locally.
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

  const base = (process.env.OLLAMA_URL ?? "http://localhost:11434").replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL ?? "llama3.1";

  let upstream: Response;
  try {
    upstream = await fetch(`${base}/api/chat`, {
      method: "POST",
      signal: request.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...toProviderMessages(body)],
      }),
    });
  } catch {
    return jsonError(
      502,
      "TRANSPORT_ERROR",
      `Cannot reach Ollama at ${base}. Is \`ollama serve\` running?`,
    );
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    return jsonError(upstream.status, "SERVER_ERROR", `Ollama error. ${detail.slice(0, 200)}`);
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
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const text = line.trim();
        if (!text) continue;
        try {
          const json = JSON.parse(text) as {
            message?: { content?: string };
            error?: string;
          };
          if (json.error) {
            yield { type: "error", code: "MODEL_ERROR", message: json.error.slice(0, 300) };
            return;
          }
          const delta = json.message?.content ?? "";
          if (delta) yield { type: "message.delta", messageId: id, text: delta };
        } catch {
          // Ignore partial NDJSON lines — they complete in the next chunk.
          buf = line + "\n" + buf;
          break;
        }
      }
    }
    yield { type: "message.end", messageId: id };
  });
};
