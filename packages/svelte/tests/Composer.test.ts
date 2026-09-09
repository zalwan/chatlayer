import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";

import { createChat, type ChatEvent, type ChatRequest } from "@chatlayer/core";
import Composer from "../src/lib/Composer.svelte";
import { flush, makeBlockingTransport, makeTransport } from "./helpers";

function replyEvents(text: string): ChatEvent[] {
  return [
    { type: "message.start", messageId: "a1", role: "assistant" },
    { type: "message.delta", messageId: "a1", text },
    { type: "message.end", messageId: "a1" },
  ];
}

describe("Composer", () => {
  it("sends a message on Enter", async () => {
    const transport = makeTransport((_req: ChatRequest) => replyEvents("hi back"));
    const chat = createChat({ transport });
    render(Composer, { props: { chat } });

    const input = screen.getByRole("textbox", { name: "Message" });
    await fireEvent.input(input, { target: { value: "Hello" } });
    await fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(chat.messages.get()).toHaveLength(2);
    });
    expect(chat.messages.get()[0].content[0].text).toBe("Hello");
  });

  it("does not send on Shift+Enter", async () => {
    const transport = makeTransport((_req: ChatRequest) => replyEvents("ok"));
    const chat = createChat({ transport });
    render(Composer, { props: { chat } });

    const input = screen.getByRole("textbox", { name: "Message" });
    await fireEvent.input(input, { target: { value: "Hello" } });
    await fireEvent.keyDown(input, { key: "Enter", shiftKey: true });

    expect(chat.messages.get()).toHaveLength(0);
  });

  it("shows a Stop button and hides Send while streaming", async () => {
    const transport = makeBlockingTransport();
    const chat = createChat({ transport });
    render(Composer, { props: { chat } });

    const input = screen.getByRole("textbox", { name: "Message" });
    await fireEvent.input(input, { target: { value: "Hello" } });
    await fireEvent.keyDown(input, { key: "Enter" });

    await flush();

    expect(screen.getByRole("button", { name: "Stop generation" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Send message" })).toBeNull();

    chat.stop();
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Send message" })).toBeTruthy();
    });
  });
});
