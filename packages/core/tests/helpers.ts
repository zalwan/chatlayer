import type { ChatEvent, ChatRequest, ChatRequestOptions, ChatTransport } from "../src";

export type TrackedTransport = ChatTransport & { requests: ChatRequest[] };

/** Build an event factory that ignores the request and returns a fixed list. */
export function events(...list: ChatEvent[]): (req: ChatRequest) => ChatEvent[] {
  return () => list;
}

/** A simple transport that records requests and yields the factory's events. */
export function makeTransport(eventFactory: (req: ChatRequest) => ChatEvent[]): TrackedTransport {
  const requests: ChatRequest[] = [];
  return {
    requests,
    async *send(
      req: ChatRequest,
      _options?: ChatRequestOptions,
    ): AsyncGenerator<ChatEvent, void, unknown> {
      requests.push(req);
      for (const e of eventFactory(req)) yield e;
    },
  };
}

/**
 * A transport that streams a start + delta, then blocks on an unresolving
 * promise that rejects with a native AbortError when the request signal aborts.
 * Useful for exercising `stop()`.
 */
export function makeBlockingTransport(): TrackedTransport {
  const requests: ChatRequest[] = [];
  return {
    requests,
    async *send(
      req: ChatRequest,
      options?: ChatRequestOptions,
    ): AsyncGenerator<ChatEvent, void, unknown> {
      requests.push(req);
      yield { type: "message.start", messageId: "m1", role: "assistant" };
      yield { type: "message.delta", messageId: "m1", text: "partial" };
      await new Promise<void>((_, reject) => {
        options?.signal?.addEventListener("abort", () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    },
  };
}

/** Flush the microtask queue (and a macrotask) so async work can settle. */
export function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
