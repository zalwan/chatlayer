/**
 * @zalwan/chatlayer-svelte — Svelte UI components for ChatLayer.
 *
 * Install this package and drop `<ChatWidget endpoint="/api/chat" />` into any
 * Svelte app. It re-exports the headless core so you only need one dependency.
 */

export { default as ChatWidget } from "./lib/ChatWidget.svelte";
export { default as MessageList } from "./lib/MessageList.svelte";
export { default as Message } from "./lib/Message.svelte";
export { default as Composer } from "./lib/Composer.svelte";
export { default as LoadingIndicator } from "./lib/LoadingIndicator.svelte";
export { default as ErrorMessage } from "./lib/ErrorMessage.svelte";
export { default as Markdown } from "./lib/Markdown.svelte";

export { applyTheme, themeStore } from "./lib/theme";
export type { ThemePreference, ResolvedTheme } from "./lib/theme";

// Headless core (re-exported for convenience).
export {
  createChat,
  HttpTransport,
  ChatError,
  ChatErrorCode,
  isAbortError,
  toErrorEvent,
  parseChatEvent,
  parseNdjsonStream,
  PROTOCOL_VERSION,
  PROTOCOL_HEADER,
  NDJSON_CONTENT_TYPE,
  writable,
  readable,
} from "@zalwan/chatlayer";

export type {
  ChatInstance,
  ChatOptions,
  HttpTransportOptions,
  ChatRequestOptions,
  ChatErrorCodeValue,
  ChatTransport,
  Readable,
  Subscribe,
  Writable,
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
} from "@zalwan/chatlayer";
