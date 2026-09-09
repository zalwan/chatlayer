import { describe, expect, it } from "vitest";

import { createChat } from "../src/create-chat";
import type { ChatStatus } from "../src/types";
import { events, flushMicrotasks, makeBlockingTransport, makeTransport } from "./helpers";

function trackStatus(chat: ReturnType<typeof createChat>): ChatStatus[] {
  const seen: ChatStatus[] = [];
  chat.status.subscribe((s) => seen.push(s));
  return seen;
}

describe("state machine — transitions", () => {
  it("goes idle -> submitted -> streaming -> idle on a successful stream", async () => {
    const transport = makeTransport(
      events(
        { type: "message.start", messageId: "m1", role: "assistant" },
        { type: "message.delta", messageId: "m1", text: "hi" },
        { type: "message.end", messageId: "m1" },
      ),
    );
    const chat = createChat({ transport });
    const statuses = trackStatus(chat);

    await chat.send("hello");

    expect(statuses).toEqual(["idle", "submitted", "streaming", "idle"]);
  });

  it("goes idle -> submitted -> streaming -> error on an error event", async () => {
    const transport = makeTransport(
      events(
        { type: "message.start", messageId: "m1", role: "assistant" },
        { type: "error", code: "MODEL_ERROR", message: "down" },
      ),
    );
    const chat = createChat({ transport });
    const statuses = trackStatus(chat);

    await chat.send("hello");

    expect(statuses).toEqual(["idle", "submitted", "streaming", "error"]);
  });

  it("goes idle -> submitted -> error when no assistant turn starts before failure", async () => {
    const transport = makeTransport(
      events({ type: "error", code: "MODEL_ERROR", message: "down" }),
    );
    const chat = createChat({ transport });
    const statuses = trackStatus(chat);

    await chat.send("hello");

    expect(statuses).toEqual(["idle", "submitted", "error"]);
  });
});

describe("state machine — abort", () => {
  it("stop() aborts and returns to idle with no error, keeping the partial reply", async () => {
    const transport = makeBlockingTransport();
    const chat = createChat({ transport });
    const statuses = trackStatus(chat);

    const sendPromise = chat.send("hi");
    await flushMicrotasks();

    expect(chat.status.get()).toBe("streaming");

    chat.stop();
    await sendPromise;

    expect(chat.status.get()).toBe("idle");
    expect(chat.error.get()).toBeNull();
    expect(statuses).toContain("streaming");

    const msgs = chat.messages.get();
    expect(msgs).toHaveLength(2);
    expect(msgs[1].content[0].text).toBe("partial");
    expect(transport.requests).toHaveLength(1);
  });
});

describe("state machine — guards", () => {
  it("send is a no-op while a generation is in-flight", async () => {
    const transport = makeBlockingTransport();
    const chat = createChat({ transport });

    const first = chat.send("first");
    await flushMicrotasks();
    expect(chat.status.get()).toBe("streaming");

    await chat.send("second"); // should be ignored — generating guard

    expect(transport.requests).toHaveLength(1);
    expect(chat.messages.get()[0].content[0].text).toBe("first");

    chat.stop();
    await first;
  });

  it("retry is a no-op while a generation is in-flight", async () => {
    const transport = makeBlockingTransport();
    const chat = createChat({ transport });

    const first = chat.send("first");
    await flushMicrotasks();

    await chat.retry(); // ignored — generating guard
    expect(transport.requests).toHaveLength(1);

    chat.stop();
    await first;
  });
});
