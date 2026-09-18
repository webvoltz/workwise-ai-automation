import { z } from 'zod';

import type { LlmProvider } from '../../providers/types.js';
import { InvalidModelOutputError, type WorkflowError } from '../../shared/errors.js';
import { parseJsonResponse } from '../../shared/parse-json.js';
import { err, ok, type Result } from '../../shared/result.js';
import { searchKnowledgeBase } from './knowledge-base.js';
import type { Citation, KnowledgeDocument, RagAnswer } from './types.js';

const WORKFLOW_NAME = 'rag-lookup';

const ragResponseSchema = z.object({
  answer: z.string().min(1),
  citedDocumentIds: z.array(z.string().min(1)).min(1),
});

export interface RagLookupOptions {
  readonly topK?: number;
}

function buildSystemPrompt(sources: readonly KnowledgeDocument[]): string {
  const sourceList = sources
    .map((source) => `[${source.id}] ${source.title}: ${source.content}`)
    .join('\n');

  return (
    'Answer the question using ONLY the sources below, and cite the id of every source you used. ' +
    'Respond with strict JSON matching {"answer":string,"citedDocumentIds":string[]}.\n\n' +
    `Sources:\n${sourceList}`
  );
}

export async function ragLookup(
  provider: LlmProvider,
  knowledgeBase: readonly KnowledgeDocument[],
  query: string,
  options: RagLookupOptions = {},
): Promise<Result<RagAnswer, WorkflowError>> {
  const retrieved = searchKnowledgeBase(knowledgeBase, query, options.topK ?? 3);
  if (retrieved.length === 0) {
    return err(
      new InvalidModelOutputError(WORKFLOW_NAME, [
        'No relevant sources were found for this query.',
      ]),
    );
  }

  const completion = await provider.complete({
    system: buildSystemPrompt(retrieved),
    prompt: query,
  });
  if (!completion.ok) {
    return completion;
  }

  const parsedJson = parseJsonResponse(completion.value.text);
  if (!parsedJson.ok) {
    return err(new InvalidModelOutputError(WORKFLOW_NAME, [parsedJson.error]));
  }

  const validated = ragResponseSchema.safeParse(parsedJson.value);
  if (!validated.success) {
    return err(
      new InvalidModelOutputError(
        WORKFLOW_NAME,
        validated.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
      ),
    );
  }

  const retrievedById = new Map(retrieved.map((document) => [document.id, document]));
  const citations: Citation[] = [];
  for (const id of validated.data.citedDocumentIds) {
    const document = retrievedById.get(id);
    if (document !== undefined) {
      citations.push({ id: document.id, title: document.title });
    }
  }

  if (citations.length === 0) {
    return err(
      new InvalidModelOutputError(WORKFLOW_NAME, [
        'The model did not cite any of the retrieved sources.',
      ]),
    );
  }

  return ok({ answer: validated.data.answer, citations });
}
