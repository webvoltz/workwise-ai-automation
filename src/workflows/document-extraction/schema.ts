import { z } from 'zod';

export const invoiceFieldsSchema = z.object({
  documentType: z.literal('invoice'),
  vendorName: z.string().min(1).nullable(),
  invoiceNumber: z.string().min(1).nullable(),
  totalAmount: z.number().nonnegative().nullable(),
  dueDate: z.string().min(1).nullable(),
});

export type InvoiceFields = z.infer<typeof invoiceFieldsSchema>;

export const REQUIRED_INVOICE_FIELDS = [
  'vendorName',
  'invoiceNumber',
  'totalAmount',
  'dueDate',
] as const;

export type RequiredInvoiceField = (typeof REQUIRED_INVOICE_FIELDS)[number];

export interface DocumentExtractionResult {
  readonly documentType: 'invoice';
  readonly fields: Omit<InvoiceFields, 'documentType'>;
  readonly missingFields: readonly RequiredInvoiceField[];
  readonly status: 'complete' | 'needs_review';
}
