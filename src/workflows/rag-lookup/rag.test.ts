import { describe, expect, it } from 'vitest';

import { createMockProvider } from '../../providers/mock-provider.js';
import {
  fullyHallucinatedCitationScript,
  invalidSchemaRagResponseScript,
  malformedRagResponseScript,
  partiallyHallucinatedCitationScript,
  refundAnswerScript,
  refundQuery,
  sampleKnowledgeBase,
  timedOutRagResponseScript,
  unmatchedQuery,
} from './fixtures.js';
import { ragLookup } from './rag.js';

describe('ragLookup', () => {
  it('returns an answer cited to the matching mock source', async () => {
    const provider = createMockProvider(refundAnswerScript);

    const result = await ragLookup(provider, sampleKnowledgeBase, refundQuery);

    expect(result).toEqual({
      ok: true,
      value: {
        answer:
          'Refunds are issued within 5 business days if you cancel within 14 days of purchase.',
        citations: [{ id: 'kb-refunds', title: 'Refund policy' }],
      },
    });
  });

  it('drops citations that do not correspond to a retrieved source', async () => {
    const provider = createMockProvider(partiallyHallucinatedCitationScript);

    const result = await ragLookup(provider, sampleKnowledgeBase, refundQuery);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.citations).toEqual([{ id: 'kb-refunds', title: 'Refund policy' }]);
    }
  });

  it('rejects a response whose citations are entirely hallucinated', async () => {
    const provider = createMockProvider(fullyHallucinatedCitationScript);

    const result = await ragLookup(provider, sampleKnowledgeBase, refundQuery);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_MODEL_OUTPUT');
    }
  });

  it('short-circuits without calling the provider when no source matches the query', async () => {
    const provider = createMockProvider([]);

    const result = await ragLookup(provider, sampleKnowledgeBase, unmatchedQuery);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_MODEL_OUTPUT');
    }
  });

  it('rejects a response that is not valid JSON', async () => {
    const provider = createMockProvider(malformedRagResponseScript);

    const result = await ragLookup(provider, sampleKnowledgeBase, refundQuery);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_MODEL_OUTPUT');
    }
  });

  it('rejects a response missing the required citedDocumentIds field', async () => {
    const provider = createMockProvider(invalidSchemaRagResponseScript);

    const result = await ragLookup(provider, sampleKnowledgeBase, refundQuery);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_MODEL_OUTPUT');
    }
  });

  it('surfaces a provider timeout instead of a validation error', async () => {
    const provider = createMockProvider(timedOutRagResponseScript);

    const result = await ragLookup(provider, sampleKnowledgeBase, refundQuery);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('PROVIDER_TIMEOUT');
    }
  });
});
