/**
 * Generate a reasonably-unique identifier for messages.
 *
 * Uses `crypto.randomUUID` when available (browsers, Node 19+), falling back to
 * a timestamp + random composition. Not cryptographically significant — only
 * used for client-side message correlation.
 */
export function generateId(prefix = "msg"): string {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${uuid}`;
}
