import type { MockScriptEntry } from '../../providers/mock-provider.js';
import type { TicketClassification } from './schema.js';

export const billingTicketText =
  'I was charged twice for my subscription this month and need a refund immediately.';

export const billingClassification: TicketClassification = {
  category: 'billing',
  priority: 'high',
  confidence: 0.92,
  rationale: 'Customer reports a duplicate charge and is requesting an immediate refund.',
};

export const billingClassificationScript: readonly MockScriptEntry[] = [
  { type: 'text', text: JSON.stringify(billingClassification) },
];

export const malformedJsonTicketScript: readonly MockScriptEntry[] = [
  { type: 'text', text: 'Sure, here is the classification: billing / high priority.' },
];

export const invalidSchemaTicketScript: readonly MockScriptEntry[] = [
  {
    type: 'text',
    text: JSON.stringify({ category: 'not-a-real-category', priority: 'high', confidence: 2 }),
  },
];
