import { cleanup } from "@testing-library/svelte";
import { afterEach } from "vitest";

// Ensure each test gets a fresh DOM.
afterEach(() => {
  cleanup();
});
