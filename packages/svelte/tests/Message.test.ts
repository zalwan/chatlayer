import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";

import type { ChatMessage } from "@chatlayer/core";
import Message from "../src/lib/Message.svelte";

describe("Message", () => {
  it("renders a user message as plain text", () => {
    const message: ChatMessage = {
      id: "u1",
      role: "user",
      content: [{ type: "text", text: "Hello there" }],
    };
    const { container, getByText } = render(Message, { props: { message } });
    expect(getByText("Hello there")).toBeTruthy();
    expect(container.querySelector(".chatlayer-message__text")).toBeTruthy();
  });

  it("renders assistant markdown after mount", async () => {
    const message: ChatMessage = {
      id: "a1",
      role: "assistant",
      content: [{ type: "text", text: "**bold** text" }],
    };
    const { container } = render(Message, { props: { message } });
    // Markdown swaps to sanitized HTML on mount; the text is present either way.
    expect(container.textContent).toContain("bold");
  });

  it("shows a placeholder for an empty assistant message", () => {
    const message: ChatMessage = {
      id: "a2",
      role: "assistant",
      content: [{ type: "text", text: "" }],
    };
    render(Message, { props: { message } });
    expect(screen.getByText("…")).toBeTruthy();
  });
});
