import type { MockScriptEntry } from '../../providers/mock-provider.js';

export const completeInvoiceText =
  'Invoice from Acme Corp. Invoice #INV-1001. Total due: $129.99. Due date: 2026-10-01.';

export const completeInvoiceScript: readonly MockScriptEntry[] = [
  {
    type: 'text',
    text: JSON.stringify({
      documentType: 'invoice',
      vendorName: 'Acme Corp',
      invoiceNumber: 'INV-1001',
      totalAmount: 129.99,
      dueDate: '2026-10-01',
    }),
  },
];

export const partialInvoiceText =
  'Invoice #INV-2002. Total due: $54.00. Vendor and due date are not printed on this scan.';

export const partialInvoiceScript: readonly MockScriptEntry[] = [
  {
    type: 'text',
    text: JSON.stringify({
      documentType: 'invoice',
      vendorName: null,
      invoiceNumber: 'INV-2002',
      totalAmount: 54,
      dueDate: null,
    }),
  },
];

export const malformedInvoiceScript: readonly MockScriptEntry[] = [
  { type: 'text', text: 'The vendor is Acme Corp and the total is $129.99.' },
];

export const invalidSchemaInvoiceScript: readonly MockScriptEntry[] = [
  { type: 'text', text: JSON.stringify({ documentType: 'receipt', totalAmount: -5 }) },
];

export const timedOutInvoiceScript: readonly MockScriptEntry[] = [
  { type: 'timeout', timeoutMs: 8000 },
];
