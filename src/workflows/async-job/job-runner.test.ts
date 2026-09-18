import { describe, expect, it, vi } from 'vitest';

import {
  createAlwaysFailingHandler,
  createAlwaysTimingOutHandler,
  createFlakyHandler,
  createInvalidOutputHandler,
} from './fixtures.js';
import { runJob } from './job-runner.js';

const noopSleep = (): Promise<void> => Promise.resolve();

describe('runJob', () => {
  it('succeeds immediately when the handler succeeds on the first attempt', async () => {
    const handler = createFlakyHandler(0, 'done');

    const result = await runJob(handler, { maxAttempts: 3, baseDelayMs: 1, sleep: noopSleep });

    expect(result.status).toBe('succeeded');
    expect(result.attempts).toBe(1);
    if (result.status === 'succeeded') {
      expect(result.value).toBe('done');
    }
  });

  it('retries transient timeouts and succeeds once the handler recovers', async () => {
    const handler = createFlakyHandler(2, 'recovered');

    const result = await runJob(handler, { maxAttempts: 3, baseDelayMs: 1, sleep: noopSleep });

    expect(result.status).toBe('succeeded');
    expect(result.attempts).toBe(3);
    expect(result.attemptLog.map((entry) => entry.outcome)).toEqual([
      'PROVIDER_TIMEOUT',
      'PROVIDER_TIMEOUT',
      'succeeded',
    ]);
  });

  it('retries every attempt and lands in manual_review once retries are exhausted', async () => {
    const handler = createAlwaysTimingOutHandler();

    const result = await runJob(handler, { maxAttempts: 3, baseDelayMs: 1, sleep: noopSleep });

    expect(result.status).toBe('manual_review');
    expect(result.attempts).toBe(3);
    if (result.status === 'manual_review') {
      expect(result.error.code).toBe('PROVIDER_TIMEOUT');
    }
    expect(result.attemptLog).toHaveLength(3);
  });

  it('fails immediately without retrying a non-retryable invalid output error', async () => {
    const handler = createInvalidOutputHandler();

    const result = await runJob(handler, { maxAttempts: 3, baseDelayMs: 1, sleep: noopSleep });

    expect(result.status).toBe('failed');
    expect(result.attempts).toBe(1);
    if (result.status === 'failed') {
      expect(result.error.code).toBe('INVALID_MODEL_OUTPUT');
    }
  });

  it('fails immediately on a single-attempt timeout instead of escalating to manual_review', async () => {
    const handler = createAlwaysTimingOutHandler();

    const result = await runJob(handler, { maxAttempts: 1, baseDelayMs: 1, sleep: noopSleep });

    expect(result.status).toBe('failed');
    expect(result.attempts).toBe(1);
    if (result.status === 'failed') {
      expect(result.error.code).toBe('PROVIDER_TIMEOUT');
    }
  });

  it('fails immediately on a single-attempt provider failure instead of escalating', async () => {
    const handler = createAlwaysFailingHandler();

    const result = await runJob(handler, { maxAttempts: 1, baseDelayMs: 1, sleep: noopSleep });

    expect(result.status).toBe('failed');
    expect(result.attempts).toBe(1);
    if (result.status === 'failed') {
      expect(result.error.code).toBe('PROVIDER_FAILURE');
    }
  });

  it('waits between attempts using the real timer-based sleep when none is provided', async () => {
    vi.useFakeTimers();
    try {
      const handler = createFlakyHandler(1, 'recovered');

      const pending = runJob(handler, { maxAttempts: 2, baseDelayMs: 5 });
      await vi.advanceTimersByTimeAsync(5);
      const result = await pending;

      expect(result.status).toBe('succeeded');
    } finally {
      vi.useRealTimers();
    }
  });
});
