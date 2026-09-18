import { describe, expect, it, vi } from 'vitest';

import { InvalidModelOutputError, ProviderTimeoutError } from './errors.js';
import { err, ok } from './result.js';
import { withRetry } from './retry.js';

const noopSleep = (): Promise<void> => Promise.resolve();

describe('withRetry', () => {
  it('returns the result immediately on first-attempt success', async () => {
    const operation = vi.fn().mockResolvedValue(ok('done'));

    const result = await withRetry(operation, { maxAttempts: 3, baseDelayMs: 1, sleep: noopSleep });

    expect(result).toEqual(ok('done'));
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('retries a retryable failure and succeeds once the operation recovers', async () => {
    const operation = vi
      .fn()
      .mockResolvedValueOnce(err(new ProviderTimeoutError('mock', 10)))
      .mockResolvedValueOnce(ok('recovered'));

    const result = await withRetry(operation, { maxAttempts: 3, baseDelayMs: 1, sleep: noopSleep });

    expect(result).toEqual(ok('recovered'));
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('returns RetryExhaustedError once every attempt fails with a retryable error', async () => {
    const timeoutError = new ProviderTimeoutError('mock', 10);
    const operation = vi.fn().mockResolvedValue(err(timeoutError));

    const result = await withRetry(operation, { maxAttempts: 3, baseDelayMs: 1, sleep: noopSleep });

    expect(operation).toHaveBeenCalledTimes(3);
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('expected an Err result');
    }
    if (result.error.code !== 'RETRY_EXHAUSTED') {
      throw new Error('expected a RetryExhaustedError');
    }

    expect(result.error.attempts).toBe(3);
    expect(result.error.lastError).toBe(timeoutError);
  });

  it('stops immediately on a non-retryable error without exhausting attempts', async () => {
    const validationError = new InvalidModelOutputError('classifier', ['bad output']);
    const operation = vi.fn().mockResolvedValue(err(validationError));

    const result = await withRetry(operation, { maxAttempts: 3, baseDelayMs: 1, sleep: noopSleep });

    expect(operation).toHaveBeenCalledTimes(1);
    expect(result).toEqual(err(validationError));
  });

  it('rejects a non-positive maxAttempts configuration', async () => {
    await expect(
      withRetry(vi.fn().mockResolvedValue(ok('unused')), {
        maxAttempts: 0,
        baseDelayMs: 1,
        sleep: noopSleep,
      }),
    ).rejects.toThrow('withRetry requires maxAttempts to be at least 1.');
  });

  it('waits between attempts using the real timer-based sleep by default', async () => {
    vi.useFakeTimers();
    try {
      const operation = vi
        .fn()
        .mockResolvedValueOnce(err(new ProviderTimeoutError('mock', 10)))
        .mockResolvedValueOnce(ok('recovered'));

      const pending = withRetry(operation, { maxAttempts: 3, baseDelayMs: 5 });
      await vi.advanceTimersByTimeAsync(5);
      const result = await pending;

      expect(result).toEqual(ok('recovered'));
    } finally {
      vi.useRealTimers();
    }
  });
});
