/**
 * Minimal framework-agnostic reactive store.
 *
 * The contract intentionally matches the Svelte store contract: an object with
 * a `subscribe(callback)` method that:
 *   1. immediately calls the callback with the current value, and
 *   2. returns an unsubscribe function.
 *
 * This lets Svelte auto-subscribe via `$store`, while remaining usable in
 * any framework or plain TypeScript through `subscribe` / `get`.
 */

export interface Subscribe<T> {
  (run: (value: T) => void): () => void;
}

export interface Readable<T> {
  get(): T;
  subscribe(run: (value: T) => void): () => void;
}

export interface Writable<T> extends Readable<T> {
  set(value: T): void;
  update(updater: (value: T) => T): void;
}

export function writable<T>(initial: T): Writable<T> {
  let value = initial;
  const subscribers = new Set<(value: T) => void>();

  function set(next: T): void {
    if (Object.is(next, value)) return;
    value = next;
    for (const run of subscribers) run(value);
  }

  function update(updater: (value: T) => T): void {
    set(updater(value));
  }

  function subscribe(run: (value: T) => void): () => void {
    subscribers.add(run);
    run(value); // Svelte contract: notify immediately with current value.
    return () => {
      subscribers.delete(run);
    };
  }

  function get(): T {
    return value;
  }

  return { get, set, update, subscribe };
}

/** A readable store whose value never changes. Handy for constants. */
export function readable<T>(value: T): Readable<T> {
  return {
    get: () => value,
    subscribe: (run) => {
      run(value);
      return () => {};
    },
  };
}
