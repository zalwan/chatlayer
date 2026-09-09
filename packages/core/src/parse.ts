import type { ChatEvent, ChatRole } from "./types";
import { ChatErrorCode } from "./transport";

/**
 * Known event `type` discriminants in protocol v1. Unknown types are ignored
 * (forward compatibility), so clients keep working when future versions emit
 * new event kinds (see PROTOCOL.md §Versioning).
 */
const KNOWN_TYPES = new Set<ChatEvent["type"]>([
  "message.start",
  "message.delta",
  "message.end",
  "error",
]);

function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Parse a single NDJSON line into a {@link ChatEvent}, or `null` if the line is
 * empty, not valid JSON, or carries an unknown/partial event.
 *
 * Malformed JSON is swallowed (`null`) rather than killing the whole stream —
 * a single bad line shouldn't abort a healthy generation.
 */
export function parseChatEvent(line: string): ChatEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(trimmed);
  } catch {
    return null;
  }

  if (typeof payload !== "object" || payload === null) return null;
  const obj = payload as Record<string, unknown>;
  const type = obj["type"];

  if (!isString(type) || !KNOWN_TYPES.has(type as ChatEvent["type"])) {
    return null;
  }

  switch (type) {
    case "message.start": {
      if (!isString(obj["messageId"]) || !isString(obj["role"])) return null;
      return {
        type: "message.start",
        messageId: obj["messageId"],
        role: obj["role"] as ChatRole,
      };
    }
    case "message.delta": {
      if (!isString(obj["messageId"]) || !isString(obj["text"])) return null;
      return { type: "message.delta", messageId: obj["messageId"], text: obj["text"] };
    }
    case "message.end": {
      if (!isString(obj["messageId"])) return null;
      return { type: "message.end", messageId: obj["messageId"] };
    }
    case "error": {
      if (!isString(obj["code"]) || !isString(obj["message"])) return null;
      return { type: "error", code: obj["code"], message: obj["message"] };
    }
    default:
      return null;
  }
}

/**
 * Read a `ReadableStream<Uint8Array>` of NDJSON and yield parsed
 * {@link ChatEvent}s as complete lines arrive. Honors an abort signal so the
 * HTTP transport can stop consuming when the user presses "stop".
 */
export async function* parseNdjsonStream(
  body: ReadableStream<Uint8Array> | null | undefined,
  signal?: AbortSignal,
): AsyncGenerator<ChatEvent, void, unknown> {
  if (!body) return;

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal?.aborted) break;

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        const event = parseChatEvent(line);
        if (event) yield event;
      }
    }

    // Flush any trailing line not terminated by a newline.
    const rest = buffer.trim();
    if (rest && !signal?.aborted) {
      const event = parseChatEvent(rest);
      if (event) yield event;
    }
  } finally {
    reader.releaseLock();
  }
}

export { ChatErrorCode };
