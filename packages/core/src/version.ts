/**
 * Chat protocol version.
 *
 * The protocol version is independent of the package version. Breaking changes
 * to the event schema or wire format bump this number. Clients send it via the
 * `X-ChatLayer-Protocol` header so backends can negotiate behavior.
 *
 * v1 — MVP: message.start / message.delta / message.end / error.
 */
export const PROTOCOL_VERSION = 1;

export const PROTOCOL_HEADER = "X-ChatLayer-Protocol";

/** NDJSON media type used by the HTTP transport stream responses. */
export const NDJSON_CONTENT_TYPE = "application/x-ndjson";
