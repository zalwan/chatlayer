import { describe, expect, it, vi } from "vitest";

import { readable, writable } from "../src/store";

describe("writable store", () => {
  it("notifies subscribers immediately with the current value", () => {
    const store = writable(1);
    const cb = vi.fn();
    const unsub = store.subscribe(cb);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(1);
    unsub();
  });

  it("notifies on set", () => {
    const store = writable(0);
    const seen: number[] = [];
    store.subscribe((v) => seen.push(v));
    store.set(5);
    expect(seen).toEqual([0, 5]);
  });

  it("applies update fn", () => {
    const store = writable(2);
    const seen: number[] = [];
    store.subscribe((v) => seen.push(v));
    store.update((n) => n * 3);
    expect(seen).toEqual([2, 6]);
  });

  it("does not notify when setting the same reference (Object.is)", () => {
    const obj = { a: 1 };
    const store = writable(obj);
    const cb = vi.fn();
    store.subscribe(cb);
    cb.mockClear();
    store.set(obj);
    expect(cb).not.toHaveBeenCalled();
  });

  it("stops notifying after unsubscribe", () => {
    const store = writable(0);
    const cb = vi.fn();
    const unsub = store.subscribe(cb);
    cb.mockClear();
    unsub();
    store.set(9);
    expect(cb).not.toHaveBeenCalled();
  });

  it("get() returns the latest value", () => {
    const store = writable("x");
    store.set("y");
    expect(store.get()).toBe("y");
  });

  it("supports multiple subscribers", () => {
    const store = writable(0);
    const a: number[] = [];
    const b: number[] = [];
    store.subscribe((v) => a.push(v));
    store.subscribe((v) => b.push(v));
    store.set(7);
    expect(a).toEqual([0, 7]);
    expect(b).toEqual([0, 7]);
  });
});

describe("readable store", () => {
  it("is immutable", () => {
    const store = readable("c");
    expect(store.get()).toBe("c");
    const cb = vi.fn();
    store.subscribe(cb);
    expect(cb).toHaveBeenCalledWith("c");
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
