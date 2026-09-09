import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";

import ChatWidget from "../src/lib/ChatWidget.svelte";
import type { ChatEvent, ChatRequest } from "@zalwan/chatlayer";
import { makeTransport } from "./helpers";

describe("ChatWidget", () => {
  it("streams an assistant reply end-to-end", async () => {
    const transport = makeTransport((_req: ChatRequest): ChatEvent[] => [
      { type: "message.start", messageId: "a1", role: "assistant" },
      { type: "message.delta", messageId: "a1", text: "Hello " },
      { type: "message.delta", messageId: "a1", text: "there" },
      { type: "message.end", messageId: "a1" },
    ]);

    render(ChatWidget, { props: { transport } });

    const input = screen.getByRole("textbox", { name: "Message" });
    await fireEvent.input(input, { target: { value: "Hi" } });
    await fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("Hello there")).toBeTruthy();
    });
  });

  it("renders an error and recovers on retry", async () => {
    let attempts = 0;
    const transport = makeTransport((_req: ChatRequest): ChatEvent[] => {
      attempts += 1;
      if (attempts === 1) {
        return [
          { type: "message.start", messageId: "a1", role: "assistant" },
          { type: "error", code: "MODEL_ERROR", message: "boom" },
        ];
      }
      return [
        { type: "message.start", messageId: "a2", role: "assistant" },
        { type: "message.delta", messageId: "a2", text: "ok" },
        { type: "message.end", messageId: "a2" },
      ];
    });

    render(ChatWidget, { props: { transport } });

    const input = screen.getByRole("textbox", { name: "Message" });
    await fireEvent.input(input, { target: { value: "Hi" } });
    await fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("boom")).toBeTruthy();
    });
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();

    await fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(screen.getByText("ok")).toBeTruthy();
    });
  });

  it("requires an endpoint or transport", () => {
    expect(() => render(ChatWidget, { props: {} })).toThrow(/endpoint/);
  });
});
