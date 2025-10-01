import debounce from "./debounce";
import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  test("should debounce calls correctly", () => {
    const callback = vi.fn();
    const { trigger } = debounce(callback, { delayMs: 100 });

    trigger();
    trigger();
    trigger();

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("should use default delay of 250ms when no options provided", () => {
    const callback = vi.fn();
    const { trigger } = debounce(callback);

    trigger();
    vi.advanceTimersByTime(249);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("should pass arguments to callback", () => {
    const callback = vi.fn();
    const { trigger } = debounce(callback, { delayMs: 100 });

    trigger("arg1", 123);
    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledWith("arg1", 123);
  });

  test("should reset timer on subsequent calls", () => {
    const callback = vi.fn();
    const { trigger } = debounce(callback, { delayMs: 100 });

    trigger();
    vi.advanceTimersByTime(50);
    trigger();
    vi.advanceTimersByTime(50);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("should enforce maxDelayMs", () => {
    const callback = vi.fn();
    const { trigger } = debounce(callback, {
      delayMs: 100,
      maxDelayMs: 200,
    });

    trigger();
    vi.advanceTimersByTime(50);
    trigger();
    vi.advanceTimersByTime(50);
    trigger();
    vi.advanceTimersByTime(50);
    trigger();
    vi.advanceTimersByTime(50);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("should use latest arguments when maxDelayMs is reached", () => {
    const callback = vi.fn();
    const { trigger } = debounce(callback, {
      delayMs: 100,
      maxDelayMs: 150,
    });

    trigger("first");
    vi.advanceTimersByTime(50);
    trigger("second");
    vi.advanceTimersByTime(50);
    trigger("third");
    vi.advanceTimersByTime(50);

    // in this case, maxDelayMs should have triggered the call
    expect(callback).toHaveBeenCalledWith("third");
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("should handle multiple trigger calls after timeout", () => {
    const callback = vi.fn();
    const { trigger } = debounce(callback, { delayMs: 100 });

    trigger();
    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);

    trigger();
    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(2);
  });
});
