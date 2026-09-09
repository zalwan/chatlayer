/**
 * Core chat protocol types for ChatLayer.
 *
 * These types define the contract between the application backend and the
 * ChatLayer UI/headless runtime. The protocol is provider-agnostic: the
 * backend owns model, persona, guardrails, and policy (see PROTOCOL.md).
 */

/** A participant in the conversation. */
export type ChatRole = "user" | "assistant" | "system";

/**
 * A single content part within a message. Discriminated by `type` so the
 * schema can grow (image, file, tool, citation, ...) without breaking the
 * base API. MVP ships only `text`.
 */
export interface TextContent {
  type: "text";
  text: string;
}

export type ChatContent = TextContent;

/** A message in the conversation. */
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: ChatContent[];
  createdAt?: string;
}

/** Request payload sent from client to backend transport. */
export interface ChatRequest {
  messages: ChatMessage[];
  /** Optional session/correlation id. */
  sessionId?: string;
  /** Optional application metadata (never trusted as AI policy — backend validates). */
  metadata?: Record<string, unknown>;
}

/**
 * The lifecycle state of the chat runtime. Drives UI affordances:
 * - `idle` — ready, input enabled, send button visible
 * - `submitted` — request sent, awaiting first token (show "thinking")
 * - `streaming` — tokens arriving (show stop button, live update)
 * - `error` — last generation failed (show retry)
 */
export type ChatStatus = "idle" | "submitted" | "streaming" | "error";

// ---------------------------------------------------------------------------
// Protocol events (see PROTOCOL.md)
// ---------------------------------------------------------------------------

export interface MessageStartEvent {
  type: "message.start";
  messageId: string;
  role: ChatRole;
}

export interface MessageDeltaEvent {
  type: "message.delta";
  messageId: string;
  text: string;
}

export interface MessageEndEvent {
  type: "message.end";
  messageId: string;
}

export interface ErrorEvent {
  type: "error";
  /** Stable error code (see PROTOCOL.md §Error codes). */
  code: string;
  /** Human-readable message safe to surface in the UI. */
  message: string;
}

/**
 * The streaming chat protocol event union. Clients MUST ignore unknown event
 * types for forward compatibility with future protocol versions.
 */
export type ChatEvent = MessageStartEvent | MessageDeltaEvent | MessageEndEvent | ErrorEvent;

/** A discriminated view of all currently-known event `type` strings. */
export type ChatEventType = ChatEvent["type"];
