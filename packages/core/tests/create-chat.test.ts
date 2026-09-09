import { describe, expect, it } from "vitest";

import { createChat } from "../src/create-chat";
import { ChatErrorCode } from "../src/transport";
import type { ChatStatus } from "../src/types";
import { events, makeTransport } from "./helpers";

describe("createChat — lifecycle", () => {
  it("appends a user message and streams an assistant reply", async () => {
    const transport = makeTransport(
      events(
        { type: "message.start", messageId: "m1", role: "assistant" },
        { type: "message.delta", messageId: "m1", text: "Hello" },
        { type: "message.delta", messageId: "m1", text: " world" },
        { type: "message.end", messageId: "m1" },
      ),
    );
    const chat = createChat({ transport });

    const statuses: ChatStatus[] = [];
    chat.status.subscribe((s) => statuses.push(s));

    await chat.send("hi");

    expect(chat.status.get()).toBe("idle");
    expect(chat.error.get()).toBeNull();

    const msgs = chat.messages.get();
    expect(msgs).toHaveLength(2);
    expect(msgs[0]).toMatchObject({ role: "user" });
    expect(msgs[0].content[0].text).toBe("hi");
    expect(msgs[1]).toMatchObject({ role: "assistant" });
    expect(msgs[1].content[0].text).toBe("Hello world");

    expect(statuses).toContain("submitted");
    expect(statuses).toContain("streaming");
  });

  it("sends the current message list (minus the new user turn input) as the request", async () => {
    const transport = makeTransport(events({ type: "message.end", messageId: "m1" }));
    const chat = createChat({ transport });
    await chat.send("hi");

    expect(transport.requests[0].messages).toEqual([
      {
        id: expect.any(String),
        role: "user",
        content: [{ type: "text", text: "hi" }],
        createdAt: expect.any(String),
      },
    ]);
  });

  it("ignores empty/whitespace input", async () => {
    const transport = makeTransport(events());
    const chat = createChat({ transport });
    await chat.send("   ");
    expect(chat.messages.get()).toEqual([]);
    expect(transport.requests).toHaveLength(0);
    expect(chat.status.get()).toBe("idle");
  });
});

describe("createChat — errors", () => {
  it("surfaces an error event, sets status to error, and keeps the partial reply", async () => {
    const transport = makeTransport(
      events(
        { type: "message.start", messageId: "m1", role: "assistant" },
        { type: "message.delta", messageId: "m1", text: "partial" },
        { type: "error", code: "MODEL_ERROR", message: "boom" },
      ),
    );
    const chat = createChat({ transport });
    await chat.send("hi");

    expect(chat.status.get()).toBe("error");
    expect(chat.error.get()).toEqual({
      type: "error",
      code: "MODEL_ERROR",
      message: "boom",
    });
    expect(chat.messages.get()[1].content[0].text).toBe("partial");
  });

  it("fails with TRANSPORT_ERROR when no transport is configured", async () => {
    const chat = createChat({});
    await chat.send("hi");
    expect(chat.status.get()).toBe("error");
    expect(chat.error.get()?.code).toBe(ChatErrorCode.TRANSPORT_ERROR);
  });
});

describe("createChat — retry & regenerate", () => {
  it("retry drops the trailing assistant message and re-runs", async () => {
    let n = 0;
    const transport = makeTransport(() => {
      n += 1;
      return [
        { type: "message.start", messageId: `m${n}`, role: "assistant" },
        { type: "message.delta", messageId: `m${n}`, text: n === 1 ? "bad" : "good" },
        { type: "message.end", messageId: `m${n}` },
      ];
    });
    const chat = createChat({ transport });

    await chat.send("hi");
    expect(chat.messages.get()[1].content[0].text).toBe("bad");

    await chat.retry();
    expect(chat.messages.get()).toHaveLength(2);
    expect(chat.messages.get()[1].content[0].text).toBe("good");
  });

  it("regenerate replaces the last assistant reply", async () => {
    let n = 0;
    const transport = makeTransport(() => {
      n += 1;
      return [
        { type: "message.start", messageId: `m${n}`, role: "assistant" },
        { type: "message.delta", messageId: `m${n}`, text: n === 1 ? "first" : "second" },
        { type: "message.end", messageId: `m${n}` },
      ];
    });
    const chat = createChat({ transport });

    await chat.send("hi");
    await chat.regenerate();

    expect(chat.messages.get()).toHaveLength(2);
    expect(chat.messages.get()[1].content[0].text).toBe("second");
  });

  it("clear resets messages, status, and error", async () => {
    const transport = makeTransport(events({ type: "error", code: "MODEL_ERROR", message: "x" }));
    const chat = createChat({ transport });
    await chat.send("hi");
    expect(chat.status.get()).toBe("error");

    chat.clear();
    expect(chat.messages.get()).toEqual([]);
    expect(chat.status.get()).toBe("idle");
    expect(chat.error.get()).toBeNull();
  });
});
