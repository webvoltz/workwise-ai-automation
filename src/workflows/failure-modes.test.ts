import { describe, expect, it } from 'vitest';

import { createMockProvider } from '../providers/mock-provider.js';
import { runJob } from './async-job/job-runner.js';
import { classifyTicket } from './ticket-classifier/classifier.js';
import { billingClassificationScript, billingTicketText } from './ticket-classifier/fixtures.js';

const noopSleep = (): Promise<void> => Promise.resolve();

describe('cross-workflow failure handling', () => {
  it('exhausts classifyTicket own retries when every attempt times out', async () => {
    const provider = createMockProvider([
      { type: 'timeout', timeoutMs: 10 },
      { type: 'timeout', timeoutMs: 10 },
    ]);

    const result = await classifyTicket(provider, billingTicketText, {
      maxAttempts: 2,
      baseDelayMs: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('RETRY_EXHAUSTED');
    }
  });

  it('runs a flaky classification as a background job and escalates to manual_review', async () => {
    const provider = createMockProvider([
      { type: 'timeout', timeoutMs: 10 },
      { type: 'timeout', timeoutMs: 10 },
      { type: 'timeout', timeoutMs: 10 },
    ]);

    const job = await runJob(() => classifyTicket(provider, billingTicketText), {
      maxAttempts: 3,
      baseDelayMs: 1,
      sleep: noopSleep,
    });

    expect(job.status).toBe('manual_review');
    expect(job.attempts).toBe(3);
    expect(job.attemptLog.every((entry) => entry.outcome === 'PROVIDER_TIMEOUT')).toBe(true);
  });

  it('runs a flaky classification as a background job and recovers before manual review', async () => {
    const provider = createMockProvider([
      { type: 'timeout', timeoutMs: 10 },
      ...billingClassificationScript,
    ]);

    const job = await runJob(() => classifyTicket(provider, billingTicketText), {
      maxAttempts: 3,
      baseDelayMs: 1,
      sleep: noopSleep,
    });

    expect(job.status).toBe('succeeded');
    expect(job.attempts).toBe(2);
  });
});
