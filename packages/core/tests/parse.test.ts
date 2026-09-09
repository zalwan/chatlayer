import { describe, expect, it } from "vitest";

import { parseChatEvent, parseNdjsonStream } from "../src/parse";

function makeStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

async function collect(iter: AsyncIterable<unknown>): Promise<unknown[]> {
  const out: unknown[] = [];
  for await (const item of iter) out.push(item);
  return out;
}

describe("parseChatEvent", () => {
  it("parses message.start", () => {
    expect(parseChatEvent('{"type":"message.start","messageId":"m1","role":"assistant"}')).toEqual({
      type: "message.start",
      messageId: "m1",
      role: "assistant",
    });
  });

  it("parses message.delta", () => {
    expect(parseChatEvent('{"type":"message.delta","messageId":"m1","text":"hi"}')).toEqual({
      type: "message.delta",
      messageId: "m1",
      text: "hi",
    });
  });

  it("parses message.end", () => {
    expect(parseChatEvent('{"type":"message.end","messageId":"m1"}')).toEqual({
      type: "message.end",
      messageId: "m1",
    });
  });

  it("parses error", () => {
    expect(parseChatEvent('{"type":"error","code":"MODEL_ERROR","message":"oops"}')).toEqual({
      type: "error",
      code: "MODEL_ERROR",
      message: "oops",
    });
  });

  it("returns null for empty/whitespace lines", () => {
    expect(parseChatEvent("")).toBeNull();
    expect(parseChatEvent("   ")).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseChatEvent("{not json")).toBeNull();
  });

  it("returns null for unknown event types (forward-compat)", () => {
    expect(parseChatEvent('{"type":"tool.start","toolCallId":"c1","name":"x"}')).toBeNull();
    expect(parseChatEvent('{"type":"citation"}')).toBeNull();
  });

  it("returns null for partial known events", () => {
    expect(parseChatEvent('{"type":"message.start","messageId":"m1"}')).toBeNull();
    expect(parseChatEvent('{"type":"message.delta","messageId":"m1"}')).toBeNull();
    expect(parseChatEvent('{"type":"message.end"}')).toBeNull();
    expect(parseChatEvent('{"type":"error","code":"X"}')).toBeNull();
  });

  it("returns null for non-object payloads", () => {
    expect(parseChatEvent('"just a string"')).toBeNull();
    expect(parseChatEvent("42")).toBeNull();
    expect(parseChatEvent("null")).toBeNull();
  });
});

describe("parseNdjsonStream", () => {
  it("yields events split across chunks", async () => {
    const stream = makeStream([
      '{"type":"message.start","messageId":"m1","role":"assistant"}\n',
      '{"type":"message.de',
      'lta","messageId":"m1","text":"Hello"}\n',
      '{"type":"message.end","messageId":"m1"}',
    ]);
    const events = await collect(parseNdjsonStream(stream));
    expect(events).toEqual([
      { type: "message.start", messageId: "m1", role: "assistant" },
      { type: "message.delta", messageId: "m1", text: "Hello" },
      { type: "message.end", messageId: "m1" },
    ]);
  });

  it("flushes a trailing line without a newline", async () => {
    const stream = makeStream(['{"type":"message.end","messageId":"m1"}']);
    const events = await collect(parseNdjsonStream(stream));
    expect(events).toEqual([{ type: "message.end", messageId: "m1" }]);
  });

  it("ignores blank lines and unknown events", async () => {
    const stream = makeStream([
      "\n",
      '{"type":"tool.start","name":"x"}\n',
      "\n",
      '{"type":"message.end","messageId":"m1"}\n',
    ]);
    const events = await collect(parseNdjsonStream(stream));
    expect(events).toEqual([{ type: "message.end", messageId: "m1" }]);
  });

  it("returns nothing for null/empty body", async () => {
    expect(await collect(parseNdjsonStream(null))).toEqual([]);
  });

  it("stops consuming when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const stream = makeStream(['{"type":"message.end","messageId":"m1"}\n']);
    const events = await collect(parseNdjsonStream(stream, controller.signal));
    expect(events).toEqual([]);
  });
});
