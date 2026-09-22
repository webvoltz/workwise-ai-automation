import { describe, expect, it } from 'vitest';

import { createMockProvider } from '../../providers/mock-provider.js';
import { extractInvoice } from './extractor.js';
import {
  completeInvoiceScript,
  completeInvoiceText,
  invalidSchemaInvoiceScript,
  malformedInvoiceScript,
  partialInvoiceScript,
  partialInvoiceText,
  timedOutInvoiceScript,
} from './fixtures.js';

describe('extractInvoice', () => {
  it('marks a fully populated invoice as complete with no missing fields', async () => {
    const provider = createMockProvider(completeInvoiceScript);

    const result = await extractInvoice(provider, completeInvoiceText);

    expect(result).toEqual({
      ok: true,
      value: {
        documentType: 'invoice',
        fields: {
          vendorName: 'Acme Corp',
          invoiceNumber: 'INV-1001',
          totalAmount: 129.99,
          dueDate: '2026-10-01',
        },
        missingFields: [],
        status: 'complete',
      },
    });
  });

  it('flags missing fields and marks the document for review', async () => {
    const provider = createMockProvider(partialInvoiceScript);

    const result = await extractInvoice(provider, partialInvoiceText);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('needs_review');
      expect(result.value.missingFields).toEqual(['vendorName', 'dueDate']);
      expect(result.value.fields.invoiceNumber).toBe('INV-2002');
    }
  });

  it('rejects a response that is not valid JSON', async () => {
    const provider = createMockProvider(malformedInvoiceScript);

    const result = await extractInvoice(provider, completeInvoiceText);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_MODEL_OUTPUT');
    }
  });

  it('rejects a response with the wrong document type or an invalid amount', async () => {
    const provider = createMockProvider(invalidSchemaInvoiceScript);

    const result = await extractInvoice(provider, completeInvoiceText);

    expect(result.ok).toBe(false);
    if (!result.ok && result.error.code === 'INVALID_MODEL_OUTPUT') {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it('surfaces a provider timeout instead of a validation error', async () => {
    const provider = createMockProvider(timedOutInvoiceScript);

    const result = await extractInvoice(provider, completeInvoiceText);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('PROVIDER_TIMEOUT');
    }
  });

  it('retries a provider timeout and succeeds once the provider recovers', async () => {
    const provider = createMockProvider([...timedOutInvoiceScript, ...completeInvoiceScript]);

    const result = await extractInvoice(provider, completeInvoiceText, {
      maxAttempts: 2,
      baseDelayMs: 1,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('complete');
    }
  });
});
