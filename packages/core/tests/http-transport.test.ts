import { describe, expect, it, vi } from "vitest";

import { HttpTransport } from "../src/http-transport";
import { ChatErrorCode } from "../src/transport";
import { NDJSON_CONTENT_TYPE, PROTOCOL_HEADER, PROTOCOL_VERSION } from "../src/version";
import type { ChatEvent, ChatRequest } from "../src/types";

function ndjsonResponse(events: ChatEvent[], init?: ResponseInit): Response {
  const encoder = new TextEncoder();
  const body = events.map((e) => JSON.stringify(e)).join("\n");
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(body));
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": NDJSON_CONTENT_TYPE },
    ...init,
  });
}

function abortError(): Error {
  const err = new Error("aborted");
  err.name = "AbortError";
  return err;
}

async function collect(iter: AsyncIterable<unknown>): Promise<unknown[]> {
  const out: unknown[] = [];
  for await (const item of iter) out.push(item);
  return out;
}

describe("HttpTransport", () => {
  it("POSTs JSON and yields NDJSON events", async () => {
    const fetchImpl = vi.fn(async () =>
      ndjsonResponse([
        { type: "message.start", messageId: "m1", role: "assistant" },
        { type: "message.delta", messageId: "m1", text: "Hi" },
        { type: "message.end", messageId: "m1" },
      ]),
    );
    const transport = new HttpTransport("/api/chat", { fetch: fetchImpl as never });
    const events = await collect(transport.send({ messages: [] } as ChatRequest));
    expect(events.map((e) => (e as ChatEvent).type)).toEqual([
      "message.start",
      "message.delta",
      "message.end",
    ]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("sends protocol version + accept headers", async () => {
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      const headers = init.headers as Record<string, string>;
      expect(init.method).toBe("POST");
      expect(headers[PROTOCOL_HEADER]).toBe(String(PROTOCOL_VERSION));
      expect(headers["Accept"]).toBe(NDJSON_CONTENT_TYPE);
      expect(headers["Content-Type"]).toBe("application/json");
      return ndjsonResponse([]);
    });
    const transport = new HttpTransport("/api/chat", { fetch: fetchImpl as never });
    await collect(transport.send({ messages: [] } as ChatRequest));
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("serializes the request as a JSON body", async () => {
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      expect(body.messages).toEqual([
        { id: "u1", role: "user", content: [{ type: "text", text: "hi" }] },
      ]);
      return ndjsonResponse([]);
    });
    const transport = new HttpTransport("/api/chat", { fetch: fetchImpl as never });
    await collect(
      transport.send({
        messages: [{ id: "u1", role: "user", content: [{ type: "text", text: "hi" }] }],
      } as ChatRequest),
    );
  });

  it("surfaces a backend error event on an error response", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response('{"type":"error","code":"MODEL_ERROR","message":"down"}', {
          status: 500,
          headers: { "Content-Type": NDJSON_CONTENT_TYPE },
        }),
    );
    const transport = new HttpTransport("/api/chat", { fetch: fetchImpl as never });
    await expect(collect(transport.send({ messages: [] } as ChatRequest))).rejects.toMatchObject({
      code: "MODEL_ERROR",
      message: "down",
    });
  });

  it("throws SERVER_ERROR on a 5xx body without an error event", async () => {
    const fetchImpl = vi.fn(async () => new Response("internal oops", { status: 500 }));
    const transport = new HttpTransport("/api/chat", { fetch: fetchImpl as never });
    await expect(collect(transport.send({ messages: [] } as ChatRequest))).rejects.toMatchObject({
      code: ChatErrorCode.SERVER_ERROR,
    });
  });

  it("throws BAD_REQUEST on 4xx", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 400 }));
    const transport = new HttpTransport("/api/chat", { fetch: fetchImpl as never });
    await expect(collect(transport.send({ messages: [] } as ChatRequest))).rejects.toMatchObject({
      code: ChatErrorCode.BAD_REQUEST,
    });
  });

  it("throws ABORTED when fetch rejects with an AbortError", async () => {
    const fetchImpl = vi.fn(async () => {
      throw abortError();
    });
    const transport = new HttpTransport("/api/chat", { fetch: fetchImpl as never });
    await expect(collect(transport.send({ messages: [] } as ChatRequest))).rejects.toMatchObject({
      code: ChatErrorCode.ABORTED,
    });
  });

  it("throws TRANSPORT_ERROR on generic network failure", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network down");
    });
    const transport = new HttpTransport("/api/chat", { fetch: fetchImpl as never });
    await expect(collect(transport.send({ messages: [] } as ChatRequest))).rejects.toMatchObject({
      code: ChatErrorCode.TRANSPORT_ERROR,
    });
  });

  it("merges custom per-request headers over defaults", async () => {
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      const headers = init.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer xyz");
      expect(headers[PROTOCOL_HEADER]).toBe(String(PROTOCOL_VERSION));
      return ndjsonResponse([]);
    });
    const transport = new HttpTransport("/api/chat", { fetch: fetchImpl as never });
    await collect(
      transport.send({ messages: [] } as ChatRequest, { headers: { Authorization: "Bearer xyz" } }),
    );
  });
});
