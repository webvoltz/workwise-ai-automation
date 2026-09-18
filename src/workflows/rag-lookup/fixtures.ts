import type { MockScriptEntry } from '../../providers/mock-provider.js';
import type { KnowledgeDocument } from './types.js';

export const sampleKnowledgeBase: readonly KnowledgeDocument[] = [
  {
    id: 'kb-refunds',
    title: 'Refund policy',
    content:
      'Refunds are issued within 5 business days for cancellations made within 14 days of purchase.',
    tags: ['billing', 'refunds'],
  },
  {
    id: 'kb-password-reset',
    title: 'Resetting your password',
    content:
      'Users can reset their password from the account settings page by requesting a reset email.',
    tags: ['account', 'security'],
  },
  {
    id: 'kb-api-rate-limits',
    title: 'API rate limits',
    content: 'The API allows 100 requests per minute per API key before returning a 429 response.',
    tags: ['api', 'technical'],
  },
];

export const refundQuery = 'What is the refund policy for cancellations?';

export const refundAnswerScript: readonly MockScriptEntry[] = [
  {
    type: 'text',
    text: JSON.stringify({
      answer: 'Refunds are issued within 5 business days if you cancel within 14 days of purchase.',
      citedDocumentIds: ['kb-refunds'],
    }),
  },
];

export const partiallyHallucinatedCitationScript: readonly MockScriptEntry[] = [
  {
    type: 'text',
    text: JSON.stringify({
      answer: 'Refunds are issued within 5 business days if you cancel within 14 days of purchase.',
      citedDocumentIds: ['kb-refunds', 'kb-does-not-exist'],
    }),
  },
];

export const fullyHallucinatedCitationScript: readonly MockScriptEntry[] = [
  {
    type: 'text',
    text: JSON.stringify({
      answer: 'Refunds are issued within 5 business days.',
      citedDocumentIds: ['kb-totally-made-up'],
    }),
  },
];

export const unmatchedQuery = 'What is the meaning of life?';

export const malformedRagResponseScript: readonly MockScriptEntry[] = [
  { type: 'text', text: 'Sure, refunds take 5 business days.' },
];

export const invalidSchemaRagResponseScript: readonly MockScriptEntry[] = [
  { type: 'text', text: JSON.stringify({ answer: 'Refunds take 5 business days.' }) },
];

export const timedOutRagResponseScript: readonly MockScriptEntry[] = [
  { type: 'timeout', timeoutMs: 8000 },
];
