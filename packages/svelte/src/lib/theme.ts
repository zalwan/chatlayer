import { writable, type Readable } from "@zalwan/chatlayer";

/** User-facing theme choice. `system` follows the OS preference. */
export type ThemePreference = "light" | "dark" | "system";

/** The concrete theme currently applied (what CSS variables target). */
export type ResolvedTheme = "light" | "dark";

const internal = writable<ResolvedTheme>("light");

/**
 * The currently resolved theme. ChatWidget sets this via {@link applyTheme}
 * and renders a `data-theme` attribute from it so CSS variables can switch.
 *
 * Note: a module-level store keeps v0.1 simple (single widget). Multi-widget
 * theming is a future extension.
 */
export const themeStore: Readable<ResolvedTheme> = {
  get: internal.get,
  subscribe: internal.subscribe,
};

const DARK_QUERY = "(prefers-color-scheme: dark)";

let media: MediaQueryList | null = null;
let mediaListener: (() => void) | null = null;

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/** Apply a theme preference, wiring up the OS listener for `system`. */
export function applyTheme(pref: ThemePreference): void {
  teardown();

  if (pref === "system") {
    internal.set(systemTheme());
    if (typeof window !== "undefined" && window.matchMedia) {
      media = window.matchMedia(DARK_QUERY);
      mediaListener = () => internal.set(systemTheme());
      media.addEventListener("change", mediaListener);
    }
  } else {
    internal.set(pref);
  }
}

function teardown(): void {
  if (media && mediaListener) {
    media.removeEventListener("change", mediaListener);
  }
  media = null;
  mediaListener = null;
}
