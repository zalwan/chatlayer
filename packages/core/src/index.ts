/**
 * @chatlayer/core — provider-agnostic headless chat runtime.
 *
 * Bring your own AI backend. ChatLayer handles the chat: message state,
 * streaming, abort, retry, regenerate, and an event-based transport protocol.
 */

export { createChat } from "./create-chat";
export type { ChatInstance, ChatOptions } from "./create-chat";

export { HttpTransport } from "./http-transport";
export type { HttpTransportOptions } from "./http-transport";

export { ChatError, ChatErrorCode, isAbortError, toErrorEvent } from "./transport";
export type { ChatRequestOptions, ChatErrorCodeValue, ChatTransport } from "./transport";

export { writable, readable } from "./store";
export type { Readable, Subscribe, Writable } from "./store";

export { parseChatEvent, parseNdjsonStream } from "./parse";
export { NDJSON_CONTENT_TYPE, PROTOCOL_HEADER, PROTOCOL_VERSION } from "./version";

export type {
  ChatContent,
  ChatEvent,
  ChatEventType,
  ChatMessage,
  ChatRequest,
  ChatRole,
  ChatStatus,
  ErrorEvent,
  MessageDeltaEvent,
  MessageEndEvent,
  MessageStartEvent,
  TextContent,
} from "./types";
