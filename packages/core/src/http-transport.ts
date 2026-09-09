import type { ChatEvent, ChatRequest } from "./types";
import { parseNdjsonStream } from "./parse";
import {
  ChatError,
  ChatErrorCode,
  isAbortError,
  type ChatRequestOptions,
  type ChatTransport,
} from "./transport";
import { NDJSON_CONTENT_TYPE, PROTOCOL_HEADER, PROTOCOL_VERSION } from "./version";

export interface HttpTransportOptions {
  /** Custom fetch implementation (e.g. for tests). Defaults to global fetch. */
  fetch?: typeof fetch;
  /** Extra headers sent on every request. */
  headers?: Record<string, string>;
  /** CORS credentials mode. Defaults to "same-origin". */
  credentials?: RequestCredentials;
}

/**
 * The default HTTP transport. `POST`s a JSON {@link ChatRequest} to an
 * endpoint and reads the response body as an NDJSON stream of
 * {@link ChatEvent}s (one JSON event per line).
 *
 * Sends `X-ChatLayer-Protocol: 1` and `Accept: application/x-ndjson` so the
 * backend can negotiate. Aborting the request stops stream consumption.
 */
export class HttpTransport implements ChatTransport {
  private readonly endpoint: string;
  private readonly options: HttpTransportOptions;

  constructor(endpoint: string, options: HttpTransportOptions = {}) {
    this.endpoint = endpoint;
    this.options = options;
  }

  async *send(
    request: ChatRequest,
    options: ChatRequestOptions = {},
  ): AsyncGenerator<ChatEvent, void, unknown> {
    const fetchImpl = this.options.fetch ?? fetch;

    let response: Response;
    try {
      response = await fetchImpl(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: NDJSON_CONTENT_TYPE,
          [PROTOCOL_HEADER]: String(PROTOCOL_VERSION),
          ...this.options.headers,
          ...options.headers,
        },
        body: JSON.stringify(request),
        signal: options.signal,
        credentials: this.options.credentials ?? "same-origin",
      });
    } catch (error) {
      if (isAbortError(error)) {
        throw new ChatError(ChatErrorCode.ABORTED, "Request aborted.");
      }
      throw new ChatError(
        ChatErrorCode.TRANSPORT_ERROR,
        `Failed to reach chat endpoint: ${toMessage(error)}`,
      );
    }

    if (!response.ok) {
      // Attempt to read a protocol `error` event from the body before falling
      // back to an HTTP-derived error.
      const error = await extractError(response);
      throw error;
    }

    yield* parseNdjsonStream(response.body, options.signal);
  }
}

function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Parse an error response. If the body contains a valid `error` event line,
 * surface it verbatim so backend-provided code/message propagate. Otherwise
 * synthesize an HTTP-appropriate error.
 */
async function extractError(response: Response): Promise<ChatError> {
  const text = await response.text().catch(() => "");

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{")) continue;
    try {
      const payload = JSON.parse(trimmed) as Record<string, unknown>;
      if (
        payload["type"] === "error" &&
        typeof payload["code"] === "string" &&
        typeof payload["message"] === "string"
      ) {
        return new ChatError(payload["code"], payload["message"]);
      }
    } catch {
      // ignore non-JSON lines
    }
  }

  const code =
    response.status >= 400 && response.status < 500
      ? ChatErrorCode.BAD_REQUEST
      : ChatErrorCode.SERVER_ERROR;
  return new ChatError(
    code,
    `Chat endpoint returned ${response.status} ${response.statusText || ""}`.trim(),
  );
}
