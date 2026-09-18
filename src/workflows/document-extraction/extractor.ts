import type { LlmProvider } from '../../providers/types.js';
import { InvalidModelOutputError, type WorkflowError } from '../../shared/errors.js';
import { parseJsonResponse } from '../../shared/parse-json.js';
import { err, ok, type Result } from '../../shared/result.js';
import {
  invoiceFieldsSchema,
  REQUIRED_INVOICE_FIELDS,
  type DocumentExtractionResult,
} from './schema.js';

const WORKFLOW_NAME = 'document-extraction';

const SYSTEM_PROMPT =
  'Extract invoice fields from the document. Respond with strict JSON matching ' +
  '{"documentType":"invoice","vendorName":string|null,"invoiceNumber":string|null,' +
  '"totalAmount":number|null,"dueDate":string|null}. Use null for anything the document does ' +
  'not state. Return JSON only, with no surrounding prose.';

export async function extractInvoice(
  provider: LlmProvider,
  documentText: string,
): Promise<Result<DocumentExtractionResult, WorkflowError>> {
  const completion = await provider.complete({ system: SYSTEM_PROMPT, prompt: documentText });
  if (!completion.ok) {
    return completion;
  }

  const parsedJson = parseJsonResponse(completion.value.text);
  if (!parsedJson.ok) {
    return err(new InvalidModelOutputError(WORKFLOW_NAME, [parsedJson.error]));
  }

  const validated = invoiceFieldsSchema.safeParse(parsedJson.value);
  if (!validated.success) {
    return err(
      new InvalidModelOutputError(
        WORKFLOW_NAME,
        validated.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
      ),
    );
  }

  const { documentType, ...fields } = validated.data;
  const missingFields = REQUIRED_INVOICE_FIELDS.filter((field) => fields[field] === null);

  return ok({
    documentType,
    fields,
    missingFields,
    status: missingFields.length === 0 ? 'complete' : 'needs_review',
  });
}
