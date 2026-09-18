import { describe, expect, it } from 'vitest';

import { createMockProvider } from '../../providers/mock-provider.js';
import { classifyTicket } from './classifier.js';
import {
  billingClassification,
  billingClassificationScript,
  billingTicketText,
  invalidSchemaTicketScript,
  malformedJsonTicketScript,
} from './fixtures.js';

describe('classifyTicket', () => {
  it('returns a validated category and priority for a well-formed response', async () => {
    const provider = createMockProvider(billingClassificationScript);

    const result = await classifyTicket(provider, billingTicketText);

    expect(result).toEqual({ ok: true, value: billingClassification });
  });

  it('rejects a response that is not valid JSON', async () => {
    const provider = createMockProvider(malformedJsonTicketScript);

    const result = await classifyTicket(provider, billingTicketText);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_MODEL_OUTPUT');
      expect(result.error.retryable).toBe(false);
    }
  });

  it('rejects a response with an invalid category, priority, or confidence', async () => {
    const provider = createMockProvider(invalidSchemaTicketScript);

    const result = await classifyTicket(provider, billingTicketText);

    expect(result.ok).toBe(false);
    if (!result.ok && result.error.code === 'INVALID_MODEL_OUTPUT') {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it('retries a provider timeout and succeeds once the provider recovers', async () => {
    const provider = createMockProvider([
      { type: 'timeout', timeoutMs: 5000 },
      ...billingClassificationScript,
    ]);

    const result = await classifyTicket(provider, billingTicketText, {
      maxAttempts: 2,
      baseDelayMs: 1,
    });

    expect(result).toEqual({ ok: true, value: billingClassification });
  });
});
