import type { ChatEvent, ChatRequest } from "./types";

/**
 * Options passed to a transport when sending a request.
 */
export interface ChatRequestOptions {
  /** Aborts the in-flight request/generation. */
  signal?: AbortSignal;
  /** Extra headers merged on top of the transport's defaults. */
  headers?: Record<string, string>;
}

/**
 * A transport carries a `ChatRequest` to the application backend and yields the
 * streamed `ChatEvent`s back. Transports know nothing about the model provider,
 * API keys, system prompt, or guardrails — those live entirely in the backend.
 *
 * Implementations: {@link HttpTransport} (NDJSON over fetch). Custom transports
 * (WebSocket, in-process mock, etc.) just implement this method.
 */
export interface ChatTransport {
  send(request: ChatRequest, options?: ChatRequestOptions): AsyncIterable<ChatEvent>;
}

/** Stable error codes (see PROTOCOL.md §Error codes). */
export const ChatErrorCode = {
  MODEL_ERROR: "MODEL_ERROR",
  TRANSPORT_ERROR: "TRANSPORT_ERROR",
  ABORTED: "ABORTED",
  BAD_REQUEST: "BAD_REQUEST",
  SERVER_ERROR: "SERVER_ERROR",
  PARSE_ERROR: "PARSE_ERROR",
} as const;

export type ChatErrorCodeValue = (typeof ChatErrorCode)[keyof typeof ChatErrorCode];

/**
 * Error thrown by the core/transport when a generation fails. Carries a stable
 * `code` so the UI can branch on failure kind. Maps 1:1 to an {@link ErrorEvent}
 * surfaced on `chat.error`.
 */
export class ChatError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ChatError";
    this.code = code;
  }

  /** True if the failure was caused by an abort (user pressed stop). */
  get aborted(): boolean {
    return this.code === ChatErrorCode.ABORTED;
  }
}

/** Build an {@link ErrorEvent} payload from a {@link ChatError}. */
export function toErrorEvent(error: ChatError): import("./types").ErrorEvent {
  return { type: "error", code: error.code, message: error.message };
}

/**
 * Detect an abort-style failure. Transports may surface aborts either as a
 * {@link ChatError} with code `ABORTED` (the HTTP transport does this) or as a
 * native `AbortError`/`DOMException`. The chat runtime treats both as a
 * user-initiated stop rather than a failure.
 */
export function isAbortError(error: unknown): boolean {
  if (error instanceof ChatError) return error.aborted;
  if (error instanceof Error) return error.name === "AbortError";
  return false;
}
