import { generateId } from "./id";
import { writable, type Readable } from "./store";
import {
  ChatError,
  ChatErrorCode,
  isAbortError,
  toErrorEvent,
  type ChatRequestOptions,
  type ChatTransport,
} from "./transport";
import type {
  ChatContent,
  ChatEvent,
  ChatMessage,
  ChatRequest,
  ChatStatus,
  ErrorEvent,
} from "./types";

export interface ChatOptions {
  /**
   * The transport used to reach the application backend. Omit when wiring the
   * UI purely via an `endpoint` (the Svelte widget creates an HttpTransport).
   */
  transport?: ChatTransport;
  /** Optional correlation id sent with each request. */
  sessionId?: string;
  /** Optional metadata forwarded to the backend (never trusted as AI policy). */
  metadata?: Record<string, unknown>;
}

export interface ChatInstance {
  /** Reactive conversation messages (newest last). */
  readonly messages: Readable<ChatMessage[]>;
  /** Reactive chat lifecycle status. */
  readonly status: Readable<ChatStatus>;
  /** Reactive error from the last failed generation, or null. */
  readonly error: Readable<ErrorEvent | null>;

  /** Append a user message and run a generation. No-op while already generating. */
  send(text: string): Promise<void>;
  /** Abort the in-flight generation, keeping any partial assistant message. */
  stop(): void;
  /** Drop the trailing (failed/partial) assistant message and re-run from the last user message. */
  retry(): Promise<void>;
  /** Drop the trailing assistant message and regenerate a fresh reply. */
  regenerate(): Promise<void>;
  /** Abort anything in-flight and reset messages/status/error. */
  clear(): void;
}

/**
 * Create a headless chat runtime. Framework-agnostic: the returned stores
 * implement the Svelte store contract so they can be consumed with `$` in
 * Svelte, or with `subscribe`/`get` anywhere else.
 *
 * @example
 * const chat = createChat({ transport: new HttpTransport("/api/chat") });
 * await chat.send("Hello");
 * chat.messages.subscribe((m) => console.log(m));
 */
export function createChat(options: ChatOptions = {}): ChatInstance {
  const messages = writable<ChatMessage[]>([]);
  const status = writable<ChatStatus>("idle");
  const error = writable<ErrorEvent | null>(null);

  let controller: AbortController | null = null;
  let generating = false;

  function buildRequest(): ChatRequest {
    return {
      messages: messages.get().map(cloneMessage),
      sessionId: options.sessionId,
      metadata: options.metadata,
    };
  }

  function fail(err: ChatError): void {
    error.set(toErrorEvent(err));
    status.set("error");
  }

  /**
   * Drive the transport loop for the current message list. The last message
   * is expected to be a user turn (send appends it; retry/regenerate trim any
   * trailing assistant turn first).
   */
  async function runGeneration(): Promise<void> {
    const transport = options.transport;
    if (!transport) {
      fail(new ChatError(ChatErrorCode.TRANSPORT_ERROR, "No transport configured."));
      return;
    }

    controller = new AbortController();
    generating = true;
    status.set("submitted");
    error.set(null);

    const requestOpts: ChatRequestOptions = { signal: controller.signal };

    try {
      for await (const event of transport.send(buildRequest(), requestOpts)) {
        handleEvent(event);
      }
      // Stream completed normally.
      status.set("idle");
    } catch (err) {
      if (isAbortError(err)) {
        // User-initiated stop: keep the partial assistant message, no error.
        status.set("idle");
      } else {
        fail(
          err instanceof ChatError ? err : new ChatError(ChatErrorCode.MODEL_ERROR, toMessage(err)),
        );
      }
    } finally {
      generating = false;
      controller = null;
    }
  }

  function handleEvent(event: ChatEvent): void {
    switch (event.type) {
      case "message.start":
        messages.update((list) => [
          ...list,
          {
            id: event.messageId,
            role: event.role,
            content: [{ type: "text", text: "" }],
          },
        ]);
        status.set("streaming");
        break;
      case "message.delta":
        messages.update((list) => appendDelta(list, event.messageId, event.text));
        break;
      case "message.end":
        // No-op: the message is already present from message.start/delta.
        break;
      case "error":
        throw new ChatError(event.code, event.message);
    }
  }

  async function send(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed || generating) return;

    messages.update((list) => [
      ...list,
      {
        id: generateId("user"),
        role: "user",
        content: [{ type: "text", text }],
        createdAt: nowIso(),
      },
    ]);

    await runGeneration();
  }

  function stop(): void {
    controller?.abort();
  }

  async function retry(): Promise<void> {
    if (generating) return;
    dropTrailingAssistant();
    await maybeRegenerate();
  }

  async function regenerate(): Promise<void> {
    if (generating) return;
    dropTrailingAssistant();
    await maybeRegenerate();
  }

  async function maybeRegenerate(): Promise<void> {
    const list = messages.get();
    const last = list[list.length - 1];
    if (last && last.role === "user") {
      await runGeneration();
    } else {
      // Nothing to generate from; reset to a clean idle state.
      status.set("idle");
    }
  }

  function clear(): void {
    controller?.abort();
    generating = false;
    controller = null;
    messages.set([]);
    status.set("idle");
    error.set(null);
  }

  function dropTrailingAssistant(): void {
    messages.update((list) => {
      if (list.length > 0 && list[list.length - 1].role === "assistant") {
        return list.slice(0, -1);
      }
      return list;
    });
  }

  return { messages, status, error, send, stop, retry, regenerate, clear };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Append streamed text to an assistant message, creating it if missing. */
function appendDelta(list: ChatMessage[], messageId: string, text: string): ChatMessage[] {
  let found = false;
  const next = list.map((message) => {
    if (message.id !== messageId) return message;
    found = true;
    const last = message.content[message.content.length - 1];
    if (last && last.type === "text") {
      const content: ChatContent[] = message.content
        .slice(0, -1)
        .concat({ type: "text", text: last.text + text });
      return { ...message, content };
    }
    const content: ChatContent[] = [...message.content, { type: "text", text }];
    return { ...message, content };
  });

  if (!found) {
    next.push({ id: messageId, role: "assistant", content: [{ type: "text", text }] });
  }
  return next;
}

/** Defensive clone so a transport cannot mutate our internal message state. */
function cloneMessage(message: ChatMessage): ChatMessage {
  return {
    ...message,
    content: message.content.map((part): ChatContent => {
      if (part.type === "text") {
        return { type: "text" as const, text: part.text };
      }
      return part;
    }),
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
