import type { ChatEvent, ChatRequest, ChatRequestOptions, ChatTransport } from "@zalwan/chatlayer";

/** A simple transport that yields a fixed event list, flushing between each. */
export function makeTransport(events: (req: ChatRequest) => ChatEvent[]): ChatTransport {
  return {
    async *send(req: ChatRequest, options?: ChatRequestOptions) {
      for (const event of events(req)) {
        if (options?.signal?.aborted) break;
        yield event;
        await Promise.resolve();
      }
    },
  };
}

/** A transport that streams a start, then blocks until aborted. */
export function makeBlockingTransport(): ChatTransport {
  return {
    async *send(_req: ChatRequest, options?: ChatRequestOptions) {
      yield { type: "message.start", messageId: "a1", role: "assistant" };
      await new Promise<void>((_resolve, reject) => {
        options?.signal?.addEventListener("abort", () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    },
  };
}

/** Flush the microtask queue. */
export function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
