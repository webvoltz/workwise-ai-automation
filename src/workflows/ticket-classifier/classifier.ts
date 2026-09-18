import type { LlmProvider } from '../../providers/types.js';
import { InvalidModelOutputError, type WorkflowError } from '../../shared/errors.js';
import { parseJsonResponse } from '../../shared/parse-json.js';
import { err, ok, type Result } from '../../shared/result.js';
import { withRetry } from '../../shared/retry.js';
import { ticketClassificationSchema, type TicketClassification } from './schema.js';

const WORKFLOW_NAME = 'support-ticket-classifier';

const SYSTEM_PROMPT =
  'You are a support ticket triage assistant. Read the ticket and respond with strict JSON ' +
  'matching {"category":"billing|technical|account|general","priority":"low|medium|high|urgent",' +
  '"confidence":0-1,"rationale":"..."}. Return JSON only, with no surrounding prose.';

export interface ClassifyTicketOptions {
  readonly maxAttempts?: number;
  readonly baseDelayMs?: number;
}

export async function classifyTicket(
  provider: LlmProvider,
  ticketText: string,
  options: ClassifyTicketOptions = {},
): Promise<Result<TicketClassification, WorkflowError>> {
  return withRetry(() => attemptClassification(provider, ticketText), {
    maxAttempts: options.maxAttempts ?? 1,
    baseDelayMs: options.baseDelayMs ?? 200,
  });
}

async function attemptClassification(
  provider: LlmProvider,
  ticketText: string,
): Promise<Result<TicketClassification, WorkflowError>> {
  const completion = await provider.complete({ system: SYSTEM_PROMPT, prompt: ticketText });
  if (!completion.ok) {
    return completion;
  }

  const parsedJson = parseJsonResponse(completion.value.text);
  if (!parsedJson.ok) {
    return err(new InvalidModelOutputError(WORKFLOW_NAME, [parsedJson.error]));
  }

  const validated = ticketClassificationSchema.safeParse(parsedJson.value);
  if (!validated.success) {
    return err(
      new InvalidModelOutputError(
        WORKFLOW_NAME,
        validated.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
      ),
    );
  }

  return ok(validated.data);
}
